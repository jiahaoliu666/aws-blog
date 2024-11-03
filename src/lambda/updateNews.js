require("dotenv").config({ path: ".env.local" });

const {
  DynamoDBClient,
  PutItemCommand,
  ScanCommand,
} = require("@aws-sdk/client-dynamodb");
const puppeteer = require("puppeteer");
const { v4: uuidv4 } = require("uuid");
const OpenAI = require("openai");
const axios = require("axios").default;
const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");
const { sendEmailNotification } = require("../services/emailService");
const {
  sendEmailWithRetry,
  failedNotifications,
  processFailedNotifications,
} = require("../utils/notificationUtils");
const { logger } = require("../utils/logger");
const { sendArticleNotification } = require("../services/lineService");

// 設定要爬取的文章數量
const NUMBER_OF_ARTICLES_TO_FETCH = 10;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
if (!process.env.MICROSOFT_TRANSLATOR_API_KEY) {
  throw new Error(
    "Microsoft Translator API Key is missing or empty. Please check your .env.local file."
  );
}

const dbClient = new DynamoDBClient({
  region: "ap-northeast-1",
});

let insertedCount = 0;
let skippedCount = 0;

const dynamoClient = new DynamoDBClient({ region: "ap-northeast-1" });

async function getNotificationUsers() {
  const params = {
    TableName: "AWS_Blog_UserNotificationSettings",
    FilterExpression: "emailNotification = :true",
    ExpressionAttributeValues: {
      ":true": { BOOL: true },
    },
  };

  try {
    const command = new ScanCommand(params);
    const response = await dynamoClient.send(command);
    return response.Items || [];
  } catch (error) {
    console.error("獲取通知用戶列表時發生錯誤:", error);
    return [];
  }
}

async function checkIfExists(title) {
  const scanParams = {
    TableName: "AWS_Blog_News",
    FilterExpression: "#title = :title",
    ExpressionAttributeNames: {
      "#title": "title",
    },
    ExpressionAttributeValues: {
      ":title": { S: title },
    },
  };

  try {
    const data = await dbClient.send(new ScanCommand(scanParams));
    if (data.Items && data.Items.length > 0) {
      const existingItem = data.Items[0];
      return existingItem.summary && existingItem.summary.S;
    }
    return false;
  } catch (error) {
    console.error("檢查文章存在時發生錯誤:", error);
    return false;
  }
}

async function summarizeArticle(url) {
  const maxTokens = 300;
  const prompt = `使用繁體中文總結這篇文章的內容：${url}`;

  if (prompt.length > 2000) {
    console.warn("請求內容過長，請檢查 URL 或上下文。");
    return "請求內容過長，無法處理。";
  }

  console.log(`正在請求總結文章: ${url}`);
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: maxTokens,
    });
    console.log(`已獲取文章總結: ${url}`);
    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error("總結文章時發生錯誤:", error);
    return "無法獲取總結";
  }
}

async function translateText(text) {
  console.log(`開始翻譯文本`);
  const endpoint = "https://api.cognitive.microsofttranslator.com";
  const subscriptionKey = process.env.MICROSOFT_TRANSLATOR_API_KEY;
  const location = process.env.MICROSOFT_TRANSLATOR_REGION;

  try {
    const response = await axios({
      baseURL: endpoint,
      url: "/translate",
      method: "post",
      headers: {
        "Ocp-Apim-Subscription-Key": subscriptionKey,
        "Ocp-Apim-Subscription-Region": location,
        "Content-type": "application/json",
        "X-ClientTraceId": uuidv4().toString(),
      },
      params: {
        "api-version": "3.0",
        from: "en",
        to: "zh-Hant",
      },
      data: [
        {
          text: text,
        },
      ],
      responseType: "json",
    });

    const translatedText = response.data[0].translations[0].text;
    console.log(`翻譯成功`);
    return translatedText;
  } catch (error) {
    console.error(
      "翻譯時發生錯誤:",
      error.response ? error.response.data : error.message
    );
    return text;
  }
}

async function saveToDynamoDB(article) {
  console.log(`開始處理文章: ${article.title}`);
  const exists = await checkIfExists(article.title);
  if (exists) {
    skippedCount++;
    console.log(`文章已存在，跳過`);
    return false;
  }

  const summary = await summarizeArticle(article.link);

  const translatedTitle = await translateText(article.title);
  const translatedDescription = await translateText(article.description);

  const articleId = uuidv4();
  const params = {
    TableName: "AWS_Blog_News",
    Item: {
      article_id: { S: articleId },
      title: { S: article.title },
      translated_title: { S: translatedTitle },
      published_at: { N: String(Math.floor(Date.now() / 1000)) },
      info: { S: article.info },
      description: { S: article.description },
      translated_description: { S: translatedDescription },
      link: { S: article.link },
      summary: { S: summary },
    },
  };

  try {
    console.log(`插入文章到資料庫`);
    await dbClient.send(new PutItemCommand(params));
    insertedCount++;

    // 獲取需要 Line 通知的用戶
    const lineUsers = await getLineNotificationUsers();

    if (lineUsers.length > 0) {
      const articleData = {
        title: translatedTitle,
        link: article.link,
        timestamp: new Date().toLocaleString("zh-TW", {
          timeZone: "Asia/Taipei",
        }),
        summary: summary,
        lineUserIds: lineUsers.map((user) => user.userId.S),
      };

      try {
        await sendArticleNotification(articleData);
        logger.info(`Line 通知已發送給 ${lineUsers.length} 位用戶`);
      } catch (error) {
        logger.error("發送 Line 通知時發生錯誤:", error);
      }
    }

    return true;
  } catch (error) {
    logger.error("儲存文章時發生錯誤:", error);
    throw error;
  }
}

async function gotoWithRetry(page, url, options, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      await page.goto(url, options);
      return;
    } catch (error) {
      if (i === retries - 1) throw error;
      console.warn(`加載失敗，重試 ${i + 1}/${retries} 次...`);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
}

async function scrapeAWSBlog() {
  let browser = null;

  // 添加環境變數檢查
  if (
    !process.env.OPENAI_API_KEY ||
    !process.env.MICROSOFT_TRANSLATOR_API_KEY
  ) {
    logger.error("缺少必要的環境變數");
    throw new Error("缺少必要的環境變數");
  }

  try {
    browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await gotoWithRetry(page, "https://aws.amazon.com/blogs/", {
      waitUntil: "networkidle2",
      timeout: 60000,
    });

    const pageData = await page.evaluate((numArticles) => {
      const titles = document.querySelectorAll(".m-card-title");
      const infos = document.querySelectorAll(".m-card-info");
      const descriptions = document.querySelectorAll(".m-card-description");
      const links = document.querySelectorAll(".m-card-title a");

      return Array.from(titles)
        .slice(0, numArticles)
        .map((titleElem, index) => ({
          title: titleElem.innerText || "沒有標題",
          info: infos[index]?.innerText || "沒有資訊",
          description: descriptions[index]?.innerText || "沒有描述",
          link: links[index]?.href || "沒有鏈接",
        }));
    }, NUMBER_OF_ARTICLES_TO_FETCH);

    for (const article of pageData) {
      const saved = await saveToDynamoDB(article);
      if (saved) {
        console.log(`文章已保存並發送通知: ${article.title}`);
      }
    }

    console.log(`成功儲存 ${insertedCount} 篇新文章`);
    console.log(`跳過了 ${skippedCount} 篇已存在的文章`);
  } catch (error) {
    console.error("爬取過程中發生錯誤:", error?.message || "未知錯誤");
    logger.error("爬取失敗:", {
      error: error?.message || "未知錯誤",
      stack: error?.stack,
    });
    throw new Error(`爬取失敗: ${error?.message || "未知錯誤"}`);
  } finally {
    if (browser !== null) {
      await browser.close();
    }
  }
}

async function getAllUserIds() {
  const params = {
    TableName: "AWS_Blog_UserProfiles",
    ProjectionExpression: "userId",
  };

  try {
    const command = new ScanCommand(params);
    const response = await dbClient.send(command);
    return response.Items?.map((item) => item.userId.S) || [];
  } catch (error) {
    console.error("獲取用戶 ID 時發生錯誤:", error);
    return [];
  }
}

async function addNotification(userId, articleId) {
  const params = {
    TableName: "AWS_Blog_UserNotifications",
    Item: {
      userId: { S: userId },
      article_id: { S: articleId },
      read: { BOOL: false },
      created_at: { N: String(Math.floor(Date.now() / 1000)) },
      notification_type: { S: "new_article" },
    },
  };

  try {
    await dbClient.send(new PutItemCommand(params));
    console.log(`通知已新增: userId=${userId}, article_id=${articleId}`);
  } catch (error) {
    console.error("新增通知時發生錯誤:", error);
  }
}

// 修改郵件模板生成函數
function generateNewsNotificationEmail(articleData) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2c5282;">AWS 部落格新文章通知</h2>
      <div style="padding: 20px; background-color: #f7fafc; border-radius: 8px;">
        <h3 style="color: #4a5568;">${articleData.title}</h3>
        <p style="color: #718096;">發布時間：${articleData.timestamp}</p>
        <a href="${articleData.link}" 
           style="display: inline-block; padding: 10px 20px; 
                  background-color: #4299e1; color: white; 
                  text-decoration: none; border-radius: 5px; 
                  margin-top: 15px;">
          閱讀全文
        </a>
      </div>
      <p style="color: #718096; font-size: 12px; margin-top: 20px;">
        此為系統自動發送的郵件，請勿直回覆。
      </p>
    </div>
  `;
}

// 修改發送通知的函數
async function sendNotifications(users, articleData) {
  for (const user of users) {
    try {
      const emailData = {
        to: user.email.S,
        articleData: {
          title: articleData.translated_title.S,
          link: articleData.link.S,
          timestamp: new Date(
            parseInt(articleData.published_at.N) * 1000
          ).toLocaleString(),
        },
      };

      // 使用重試機制發送郵件
      await sendEmailWithRetry(emailData);
    } catch (error) {
      console.error(`發送通知給 ${user.email.S} 失敗:`, error);

      // 添加到失敗隊列
      failedNotifications.push({
        userId: user.userId.S,
        articleId: articleData.id.S,
        email: user.email.S,
        retryCount: 0,
      });
    }
  }

  // 處理失敗隊列
  if (failedNotifications.length > 0) {
    await processFailedNotifications();
  }
}

// 添加日誌記錄函數
const logError = (error, context) => {
  console.error(`[${new Date().toISOString()}] ${context}:`, error);
  // 可以添加錯誤追蹤或監控服務的整合
};

// 在檔案開頭添加
const requiredEnvVars = [
  "NEXT_PUBLIC_AWS_ACCESS_KEY_ID",
  "NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY",
  "NEXT_PUBLIC_SES_SENDER_EMAIL",
  "OPENAI_API_KEY",
  "MICROSOFT_TRANSLATOR_API_KEY",
];

requiredEnvVars.forEach((varName) => {
  if (!process.env[varName]) {
    throw new Error(`Missing required environment variable: ${varName}`);
  }
});

async function getLineNotificationUsers() {
  const params = {
    TableName: "AWS_Blog_UserNotificationSettings",
    FilterExpression: "lineNotification = :true",
    ExpressionAttributeValues: {
      ":true": { BOOL: true },
    },
  };

  try {
    const data = await dbClient.send(new ScanCommand(params));
    return data.Items || [];
  } catch (error) {
    logger.error("獲取 Line 通知用戶時發生錯誤:", error);
    return [];
  }
}

(async () => {
  try {
    await scrapeAWSBlog();
  } catch (error) {
    logger.error("執行爬蟲時發生錯誤:", {
      message: error?.message || "未知錯誤",
      stack: error?.stack,
    });
    process.exit(1);
  }
})();
