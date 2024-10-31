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

// 設定要爬取的文章數量
const NUMBER_OF_ARTICLES_TO_FETCH = 8;

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
    console.log(`文章插入成功`);

    // 獲取所有用戶的 userId
    const userIds = await getAllUserIds();
    let notifiedUserCount = 0;
    for (const userId of userIds) {
      await addNotification(userId, articleId);
      notifiedUserCount++;
    }

    console.log(`通知了 ${notifiedUserCount} 名用戶`);

    return true;
  } catch (error) {
    console.error("插入文章時發生錯誤:", error);
    return false;
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
      await saveToDynamoDB(article);
    }

    console.log(`成功儲存 ${insertedCount} 篇新文章`);
    console.log(`跳過了 ${skippedCount} 篇已存在的文章`);
  } catch (error) {
    console.error("爬取過程中發生錯誤:", error.message);
  } finally {
    if (browser !== null) {
      await browser.close();
    }
  }
}

async function getAllUserIds() {
  const params = {
    TableName: "AWS_Blog_UserProfiles", // 假設用戶資料儲存在這個表中
    ProjectionExpression: "userId", // 只選擇 userId 欄位
  };

  try {
    const data = await dbClient.send(new ScanCommand(params));
    return data.Items.map((item) => item.userId.S);
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
    },
  };

  try {
    await dbClient.send(new PutItemCommand(params));
    console.log(`通知已新增: userId=${userId}, article_id=${articleId}`);
  } catch (error) {
    console.error("新增通知時發生錯誤:", error);
  }
}

(async () => {
  await scrapeAWSBlog();
})();
