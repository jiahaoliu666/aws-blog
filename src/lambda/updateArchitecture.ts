import dotenv from 'dotenv';
import {
  DynamoDBClient,
  PutItemCommand,
  ScanCommand,
  AttributeValue
} from "@aws-sdk/client-dynamodb";
import * as puppeteer from "puppeteer";
import { v4 as uuidv4 } from "uuid";
import OpenAI from "openai";
import { logger } from "../utils/logger.js";
import { lineService } from "../services/lineService.js";
import { sendEmailWithRetry, failedNotifications, processFailedNotifications } from "../utils/notificationUtils.js";

// 介面定義
interface Architecture {
  title: string;
  description: string;
  link: string;
}

interface ArchitectureData {
  title: string;
  link: string;
  timestamp: string;
  summary: string;
}

interface NotificationUser {
  userId: { S: string };
  email: { S: string };
}

// 環境變數配置
dotenv.config({ path: ".env.local" });

// 常量定義
const NUMBER_OF_ARCHITECTURES_TO_FETCH = 3;

// 初始化客戶端
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const dbClient = new DynamoDBClient({
  region: "ap-northeast-1",
});

let insertedCount = 0;
let skippedCount = 0;

// 主要功能函數
async function checkIfExists(title: string): Promise<boolean | string> {
  const scanParams = {
    TableName: process.env.DYNAMODB_ARCHITECTURE_TABLE || 'AWS_Blog_Architecture',
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
    logger.error("檢查架構存在時發生錯誤:", error);
    return false;
  }
}

async function summarizeArchitecture(url: string): Promise<string> {
  const maxTokens = 200;
  const prompt = `請用繁體中文簡潔扼要地總結這個 AWS Architecture 的主要內容（限 100 字以內）：${url}
要求：
1. 直接說明此架構的主要功能
2. 只提及關鍵技術點或架構特色
3. 避免贅詞`;

  if (prompt.length > 2000) {
    console.warn('請求內容過長，請檢查 URL 或上下文。');
    return '請求內容過長，無法處理。';
  }

  console.log(`正在請求總結架構: ${url}`);
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: maxTokens,
    });
    console.log(`已獲取架構總結`);
    return response.choices[0]?.message?.content?.trim() || "無法獲取總結";
  } catch (error) {
    console.error("總結架構時發生錯誤:", error);
    return "無法獲取總結";
  }
}

async function translateText(text: string): Promise<string> {
  console.log(`開始翻譯文本`);
  
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: '你是一位專業的翻譯專家。請將英文翻譯成標準繁體中文，注意事項：\n1. 必須使用繁體中文，不可出現簡體字\n2. 保持 AWS 相關專業術語的準確性和一致性\n3. 遵循台灣地區的用語習慣\n4. 確保翻譯結果通順且專業\n5. 保留原文中的專有名詞，如 AWS 服務名稱'
        },
        {
          role: 'user',
          content: `請將以下文本翻譯成繁體中文：\n${text}`
        }
      ],
      temperature: 0.2,
    });

    const translatedText = response.choices[0]?.message?.content?.trim() || text;
    console.log(`翻譯成功`);
    return translatedText;
  } catch (error) {
    console.error('翻譯時發生錯誤:', error);
    return text;
  }
}

async function saveToDynamoDB(architecture: Architecture): Promise<boolean> {
  console.log(`開始處理架構: ${architecture.title}`);
  const exists = await checkIfExists(architecture.title);
  if (exists) {
    skippedCount++;
    console.log(`架構已存在，跳過`);
    return false;
  }

  const summary = await summarizeArchitecture(architecture.link);
  const translatedTitle = await translateText(architecture.title);
  const translatedDescription = await translateText(architecture.description);

  const architectureId = uuidv4();
  const params = {
    TableName: process.env.DYNAMODB_ARCHITECTURE_TABLE || 'AWS_Blog_Architecture',
    Item: {
      article_id: { S: architectureId },
      title: { S: architecture.title },
      translated_title: { S: translatedTitle },
      description: { S: architecture.description },
      translated_description: { S: translatedDescription },
      link: { S: architecture.link },
      summary: { S: summary },
      created_at: { N: String(Math.floor(Date.now() / 1000)) },
    },
  };

  try {
    console.log(`插入架構到資料庫`);
    await dbClient.send(new PutItemCommand(params));
    insertedCount++;

    const architectureData: ArchitectureData = {
      title: translatedTitle,
      link: architecture.link,
      timestamp: Date.now().toString(),
      summary: summary
    };

    // 發送 LINE 通知
    await sendLineNotifications(architectureData);
    
    // 新增用戶通知
    await broadcastNewArchitecture(architectureId);

    return true;
  } catch (error) {
    logger.error('儲存架構時發生錯誤:', error);
    return false;
  }
}

async function gotoWithRetry(
  page: puppeteer.Page,
  url: string,
  options: puppeteer.WaitForOptions & { timeout?: number },
  retries = 3
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

async function scrapeAWSArchitectures(): Promise<void> {
  let browser: puppeteer.Browser | null = null;

  try {
    browser = await puppeteer.launch({ 
      headless: true,
      args: ['--incognito'] 
    });
    const page = await browser.newPage();
    
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9'
    });

    await gotoWithRetry(
      page,
      'https://aws.amazon.com/architecture/',
      {
        waitUntil: 'networkidle2',
        timeout: 60000,
      }
    );

    const cards = await page.$$('.m-card-container');
    const architectures = [];

    for (const card of cards.slice(0, NUMBER_OF_ARCHITECTURES_TO_FETCH)) {
      await card.hover();
      await new Promise(resolve => setTimeout(resolve, 500));

      const architecture = await card.evaluate((el) => ({
        title: el.querySelector('.m-headline a')?.textContent?.trim() || '沒有標題',
        description: el.querySelector('.m-desc')?.textContent?.trim() || '沒有描述',
        link: (el.querySelector('.m-headline a') as HTMLAnchorElement)?.href || '沒有連結',
      }));

      architectures.push(architecture);
    }

    for (const architecture of architectures) {
      await saveToDynamoDB(architecture);
    }

    console.log(`\n📊 更新執行報告`);
    console.log(`==================`);
    console.log(`✅ 新增架構數量: ${insertedCount}`);
    console.log(`⏭️ 已存在架構數: ${skippedCount}`);
    console.log(`🔄 總處理架構數: ${insertedCount + skippedCount}`);
    console.log(`==================\n`);

  } catch (error) {
    console.error("執行更新時發生錯誤:", error instanceof Error ? error.message : String(error));
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// 通知相關函數
async function sendLineNotifications(architectureData: ArchitectureData): Promise<void> {
  try {
    const lineUsers = await getLineNotificationUsers();
    if (lineUsers.length > 0 && process.env.LINE_CHANNEL_ACCESS_TOKEN) {
      await lineService.sendSolutionNotification(architectureData);
      logger.info(`成功發送 LINE 通知給 ${lineUsers.length} 位用戶`);
    }
  } catch (error) {
    logger.warn("LINE 通知發送失敗:", error);
  }
}

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
    }));
  } catch (error) {
    logger.error("獲取 Line 通知用戶時發生錯誤:", error);
    return [];
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
    logger.error("獲取用戶 ID 時發生錯誤:", error);
    return [];
  }
}

async function addNotification(userId: string, architectureId: string): Promise<void> {
  const params = {
    TableName: "AWS_Blog_UserNotifications",
    Item: {
      userId: { S: userId },
      article_id: { S: architectureId },
      read: { BOOL: false },
      created_at: { N: String(Math.floor(Date.now() / 1000)) },
      category: { S: "architecture" }
    }
  };

  try {
    await dbClient.send(new PutItemCommand(params));
    logger.info(`成功新增通知: userId=${userId}, architecture_id=${architectureId}`);
  } catch (error) {
    logger.error("新增通知失敗:", error);
    throw error;
  }
}

async function broadcastNewArchitecture(architectureId: string): Promise<void> {
  try {
    const users = await getAllUserIds();
    for (const userId of users) {
      await addNotification(userId, architectureId);
    }
  } catch (error) {
    logger.error("廣播新架構通知時發生錯誤:", error);
  }
}

// 主程序執行
(async () => {
  try {
    await scrapeAWSArchitectures();
  } catch (error) {
    logger.error("執行更新程序時發生錯誤:", error);
    process.exit(1);
  }
})();