import dotenv from 'dotenv';
import {
  DynamoDBClient,
  PutItemCommand,
  ScanCommand,
  AttributeValue
} from "@aws-sdk/client-dynamodb";
import puppeteer, { Browser, Page } from "puppeteer";
import { v4 as uuidv4 } from "uuid";
import OpenAI from "openai";
import axios, { AxiosResponse } from "axios";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { sendEmailNotification } from "../services/emailService";
import {
  sendEmailWithRetry,
  failedNotifications,
  processFailedNotifications,
} from "@/utils/notificationUtils";
import { logger } from "../utils/logger";
import { lineService } from "../services/lineService";

// 介面定義
interface Article {
  title: string;
  info: string;
  description: string;
  link: string;
}

interface ArticleData {
  title: string;
  link: string;
  timestamp: string;
  summary: string;
}

interface EmailData {
  to: string;
  subject: string;
  content: string;
  articleData: {
    title: string;
    link: string;
    timestamp: string;
    content: string;
  };
}

interface DynamoDBArticle {
  article_id: { S: string };
  translated_title: { S: string };
  link: { S: string };
  published_at: { N: string };
  summary: { S: string };
}

interface NotificationUser {
  userId: { S: string };
  email: { S: string };
}

interface TranslatorResponse {
  translations: Array<{
    text: string;
  }>;
}

// 環境變數配置
dotenv.config({ path: ".env.local" });

// 常量定義
const NUMBER_OF_ARTICLES_TO_FETCH = 10;

// 初始化客戶端
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const dbClient = new DynamoDBClient({
  region: "ap-northeast-1",
});

let insertedCount = 0;
let skippedCount = 0;

// 環境變數檢查
const requiredEnvVars = [
  "NEXT_PUBLIC_AWS_ACCESS_KEY_ID",
  "NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY",
  "NEXT_PUBLIC_SES_SENDER_EMAIL",
  "OPENAI_API_KEY",
  "MICROSOFT_TRANSLATOR_API_KEY",
] as const;

requiredEnvVars.forEach((varName) => {
  if (!process.env[varName]) {
    throw new Error(`Missing required environment variable: ${varName}`);
  }
});

// 主要功能函數
async function getNotificationUsers(): Promise<NotificationUser[]> {
  const params = {
    TableName: "AWS_Blog_UserNotificationSettings",
    FilterExpression: "emailNotification = :true",
    ExpressionAttributeValues: {
      ":true": { BOOL: true },
    },
    ProjectionExpression: "userId, email",
  };

  try {
    const command = new ScanCommand(params);
    const response = await dbClient.send(command);
    return (response.Items || []).map(item => ({
      userId: { S: item.userId.S || '' },
      email: { S: item.email.S || '' }
    })) as NotificationUser[];
  } catch (error) {
    console.error("獲取通知用戶列表時發生錯誤:", error);
    return [];
  }
}

async function checkIfExists(title: string): Promise<boolean | string> {
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
      return existingItem.summary?.S || false;
    }
    return false;
  } catch (error) {
    console.error("檢查文章存在時發生錯誤:", error);
    return false;
  }
}

async function summarizeArticle(url: string, index: number): Promise<string> {
  const maxTokens = 300;
  const prompt = `使用繁體中文總結這篇文章的內容：${url}`;

  if (prompt.length > 2000) {
    console.warn("請求內容過長，請檢查 URL 或上下文。");
    return "請求內容過長，無法處理。";
  }

  console.log(`第${index + 1}篇請求文章總結`);
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: maxTokens,
    });
    console.log(`第${index + 1}篇文章總結完成`);
    return response.choices[0]?.message?.content?.trim() || "無法獲取總結";
  } catch (error) {
    console.error("總結文章時發生錯誤:", error);
    return "無法獲取總結";
  }
}

async function translateText(text: string): Promise<string> {
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
        "X-ClientTraceId": uuidv4(),
      },
      params: {
        "api-version": "3.0",
        from: "en",
        to: "zh-Hant",
      },
      data: [{ text }],
      responseType: "json",
    });

    return response.data[0].translations[0].text;
  } catch (error) {
    console.error(
      "翻譯時發生錯誤:",
      error instanceof Error ? error.message : String(error)
    );
    return text;
  }
}

async function saveToDynamoDB(
  article: Article,
  translatedTitle: string,
  summary: string
): Promise<boolean> {
  console.log(`處理文章: ${article.title}`);
  
  if (!article.title || !article.link || !article.description || !article.info) {
    logger.error("文章缺少必要欄位:", { article });
    return false;
  }

  const finalTranslatedTitle = translatedTitle || await translateText(article.title);
  const finalSummary = summary || "暫無摘要";
  const translatedDescription = await translateText(article.description);

  const articleId = uuidv4();
  const params = {
    TableName: "AWS_Blog_News",
    Item: {
      article_id: { S: articleId },
      title: { S: article.title },
      translated_title: { S: finalTranslatedTitle },
      published_at: { N: String(Math.floor(Date.now() / 1000)) },
      info: { S: article.info },
      description: { S: article.description },
      translated_description: { S: translatedDescription },
      link: { S: article.link },
      summary: { S: finalSummary },
    },
  };

  try {
    console.log(`插入文章到資料庫: ${finalTranslatedTitle}`);
    await dbClient.send(new PutItemCommand(params));
    insertedCount++;

    const articleData: ArticleData = {
      title: finalTranslatedTitle,
      link: article.link,
      timestamp: Date.now().toString(),
      summary: finalSummary,
    };

    const lineUsers = await getLineNotificationUsers();
    if (lineUsers.length > 0) {
      try {
        await lineService.sendNewsNotification(articleData);
        logger.info(`成功發送 LINE 通知給 ${lineUsers.length} 位用戶`);
      } catch (error) {
        logger.error("發送 LINE 通知失敗:", error);
      }
    }

    console.log(`✅ 成功儲存文章`);
    return true;
  } catch (error) {
    logger.error("儲存文章失敗:", error);
    return false;
  }
}

async function gotoWithRetry(
  page: Page,
  url: string,
  options: Parameters<Page['goto']>[1],
  retries: number = 3
): Promise<void> {
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

async function scrapeAWSBlog(): Promise<void> {
  let browser: Browser | null = null;

  if (!process.env.OPENAI_API_KEY || !process.env.MICROSOFT_TRANSLATOR_API_KEY) {
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

    const pageData = await page.evaluate((numArticles: number) => {
      const titles = document.querySelectorAll(".m-card-title");
      const infos = document.querySelectorAll(".m-card-info");
      const descriptions = document.querySelectorAll(".m-card-description");
      const links = document.querySelectorAll(".m-card-title a");

      return Array.from(titles)
        .slice(0, numArticles)
        .map((titleElem, index) => ({
          title: (titleElem as HTMLElement).innerText || "沒有標題",
          info: (infos[index] as HTMLElement)?.innerText || "沒有資訊",
          description: (descriptions[index] as HTMLElement)?.innerText || "沒有述",
          link: (links[index] as HTMLAnchorElement)?.href || "沒有鏈接",
        }));
    }, NUMBER_OF_ARTICLES_TO_FETCH);

    for (const [index, article] of pageData.entries()) {
      try {
        const exists = await checkIfExists(article.title);
        if (exists) {
          skippedCount++;
          console.log(`第${index + 1}篇 ⏭️ 文章已存在，跳過`);
          continue;
        }

        const translatedTitle = await translateText(article.title);
        const summary = await summarizeArticle(article.link, index);
        const saved = await saveToDynamoDB(article, translatedTitle, summary);
        if (saved) {
          console.log(
            `第${index + 1}篇 文章已保存並發送通知: ${article.title}`
          );
        }
      } catch (error) {
        logger.error(
          `處理第${index + 1}篇文章時發生錯誤: ${article.title}`,
          error
        );
      }
    }

    console.log(`\n📊 爬蟲統計:`);
    console.log(`✅ 新文章: ${insertedCount} 篇`);
    console.log(`⏭️ 已存在: ${skippedCount} 篇`);
    console.log(`總計處理: ${insertedCount + skippedCount} 篇\n`);
  } catch (error) {
    console.error("❌ 爬蟲失敗:", (error as Error)?.message || "未知錯誤");
    throw error;
  } finally {
    if (browser !== null) {
      await browser.close();
    }
  }
}

async function getAllUserIds(): Promise<string[]> {
  const params = {
    TableName: "AWS_Blog_UserProfiles",
    ProjectionExpression: "userId",
  };

  try {
    const command = new ScanCommand(params);
    const response = await dbClient.send(command);
    return response.Items?.map((item) => item.userId.S as string) || [];
  } catch (error) {
    console.error("獲取用戶 ID 時發生錯誤:", error);
    return [];
  }
}

async function addNotification(userId: string, articleId: string): Promise<void> {
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

function generateNewsNotificationEmail(articleData: ArticleData): string {
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
        此為系統自動發送的郵件，請直回覆。
      </p>
    </div>
  `;
}

async function sendNotifications(
  users: NotificationUser[],
  articleData: DynamoDBArticle
): Promise<void> {
  for (const user of users) {
    try {
      const emailData: EmailData = {
        to: user.email.S,
        subject: "AWS 部落格新文章通知",
        content: generateNewsNotificationEmail({
          title: articleData.translated_title.S,
          link: articleData.link.S,
          timestamp: articleData.published_at.N,
          summary: ""
        }),
        articleData: {
          title: articleData.translated_title.S,
          link: articleData.link.S,
          timestamp: articleData.published_at.N,
          content: articleData.summary.S
        }
      };

      await sendEmailWithRetry(emailData);
    } catch (error) {
      console.error(`發送通知給 ${user.email.S} 失敗:`, error);

      failedNotifications.push({
        userId: user.userId.S,
        articleId: articleData.article_id.S,
        email: user.email.S,
        retryCount: 0,
      });
    }
  }

  if (failedNotifications.length > 0) {
    await processFailedNotifications();
  }
}

const logError = (error: Error | unknown, context: string): void => {
  console.error(`[${new Date().toISOString()}] ${context}:`, error);
};

async function getLineNotificationUsers(): Promise<NotificationUser[]> {
  const params = {
    TableName: "AWS_Blog_UserNotificationSettings",
    FilterExpression: "lineNotification = :true",
    ExpressionAttributeValues: {
      ":true": { BOOL: true },
    },
  };

  try {
    const command = new ScanCommand(params);
    const response = await dbClient.send(command);
    return (response.Items || []).map(item => ({
      userId: { S: item.userId.S || '' },
      email: { S: item.email.S || '' }
    })) as NotificationUser[];
  } catch (error) {
    logger.error("獲取 Line 通知用戶時發生錯誤:", error);
    return [];
  }
}

// 主程序執行
(async () => {
  try {
    await scrapeAWSBlog();
  } catch (error) {
    logger.error("執行爬蟲時發生錯誤:", {
      message: (error as Error)?.message || "未知錯誤",
      stack: (error as Error)?.stack,
    });
    process.exit(1);
  }
})();