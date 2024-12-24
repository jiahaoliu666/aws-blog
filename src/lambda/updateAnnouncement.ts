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
interface Announcement {
  title: string;
  info: string;
  link: string;
}

interface AnnouncementData {
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
const NUMBER_OF_ANNOUNCEMENTS_TO_FETCH = 2;

// 初始化客戶端
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const dbClient = new DynamoDBClient({
  region: "ap-northeast-1",
});

let insertedCount = 0;
let skippedCount = 0;

// 修改日誌記錄方式，保持一致性
const logError = (error: Error | unknown, context: string): void => {
  console.error(`[${new Date().toISOString()}] ${context}:`, error);
};

// 主要功能函數
async function checkIfExists(title: string): Promise<boolean | string> {
  const scanParams = {
    TableName: "AWS_Blog_Announcement",
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
    logger.error("檢查公告存在時發生錯誤:", error);
    return false;
  }
}

async function summarizeAnnouncement(url: string): Promise<string> {
  const maxTokens = 200;
  const prompt = `請用繁體中文簡潔扼要地總結這篇 AWS 公告的主要內容（限 100 字以內）：${url}
要求：
1. 直接說明此更新的主要功能/服務
2. 只提及關鍵改進或新功能
3. 避免贅詞`;

  if (prompt.length > 2000) {
    console.warn('請求內容過長，請檢查 URL 或上下文。');
    return '請求內容過長，無法處理。';
  }

  console.log(`正在請求總結文章: ${url}`);
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: maxTokens,
    });
    console.log(`已獲取文章總結`);
    return response.choices[0]?.message?.content?.trim() || "無法獲取總結";
  } catch (error) {
    console.error("總結公告時發生錯誤:", error);
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

async function saveToDynamoDB(announcement: Announcement): Promise<boolean> {
  const exists = await checkIfExists(announcement.title);
  if (exists) {
    skippedCount++;
    logger.info(`公告已存在，跳過: ${announcement.title}`);
    return false;
  }

  const summary = await summarizeAnnouncement(announcement.link);
  const translatedTitle = await translateText(announcement.title);

  const announcementId = uuidv4();
  const params = {
    TableName: "AWS_Blog_Announcement",
    Item: {
      article_id: { S: announcementId },
      title: { S: announcement.title },
      translated_title: { S: translatedTitle },
      info: { S: announcement.info },
      link: { S: announcement.link },
      summary: { S: summary },
      published_at: { N: String(Math.floor(Date.now() / 1000)) },
    }
  };

  try {
    await dbClient.send(new PutItemCommand(params));
    insertedCount++;

    const announcementData: AnnouncementData = {
      title: translatedTitle,
      link: announcement.link,
      timestamp: new Date().toISOString(),
      summary: summary
    };

    // 發送 LINE 通知
    await sendLineNotifications(announcementData);
    
    // 新增用戶通知
    await broadcastNewAnnouncement(announcementId);

    return true;
  } catch (error) {
    logger.error('儲存公告時發生錯誤:', error);
    return false;
  }
}

async function scrapeAWSAnnouncements(): Promise<void> {
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
      "https://aws.amazon.com/about-aws/whats-new/?whats-new-content-all.sort-by=item.additionalFields.postDateTime&whats-new-content-all.sort-order=desc&awsf.whats-new-categories=*all",
      { waitUntil: "networkidle2", timeout: 60000 }
    );

    const announcements = await page.evaluate((fetchCount) => {
      const titles = document.querySelectorAll(".m-card-title");
      const infos = document.querySelectorAll(".m-card-info");
      const links = document.querySelectorAll(".m-card-title a");

      const formatDate = (dateStr: string): string => {
        if (!dateStr) return "沒有資訊";
        const parts = dateStr.trim().split('/');
        if (parts.length !== 3) return dateStr;
        const [month, day, year] = parts;
        return `${year}年${month}月${day}日`;
      };

      return Array.from(titles).slice(0, fetchCount).map((titleElem, index) => ({
        title: titleElem.textContent?.trim() || "沒有標題",
        info: formatDate(infos[index]?.textContent?.trim() || "沒有資訊"),
        link: (links[index] as HTMLAnchorElement)?.href || "沒有鏈接",
      }));
    }, NUMBER_OF_ANNOUNCEMENTS_TO_FETCH);

    for (const announcement of announcements) {
      await saveToDynamoDB(announcement);
    }

    logger.info(`\n📊 更新執行報告`);
    logger.info(`==================`);
    logger.info(`✅ 新增公告數量: ${insertedCount}`);
    logger.info(`⏭️ 已存在公告數: ${skippedCount}`);
    logger.info(`🔄 總處理公告數: ${insertedCount + skippedCount}`);
    logger.info(`==================\n`);

  } catch (error) {
    console.error("執行更新時發生錯誤:", error instanceof Error ? error.message : String(error));
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// 新增 gotoWithRetry 函數
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

// 通知相關函數
async function sendLineNotifications(announcementData: AnnouncementData): Promise<void> {
  try {
    const lineUsers = await getLineNotificationUsers();
    if (lineUsers.length > 0 && process.env.LINE_CHANNEL_ACCESS_TOKEN) {
      await lineService.sendAnnouncementNotification(announcementData);
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

async function broadcastNewAnnouncement(announcementId: string): Promise<void> {
  try {
    const users = await getAllUserIds();
    for (const userId of users) {
      await addNotification(userId, announcementId);
    }
  } catch (error) {
    logger.error("廣播新公告通知時發生錯誤:", error);
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

async function addNotification(userId: string, announcementId: string): Promise<void> {
  const params = {
    TableName: "AWS_Blog_UserNotifications",
    Item: {
      userId: { S: userId },
      article_id: { S: announcementId },
      read: { BOOL: false },
      created_at: { N: String(Math.floor(Date.now() / 1000)) },
      category: { S: "announcement" }
    }
  };

  try {
    await dbClient.send(new PutItemCommand(params));
    logger.info(`成功新增通知: userId=${userId}, announcement_id=${announcementId}`);
  } catch (error) {
    logger.error("新增通知失敗:", error);
    throw error;
  }
}

// 主程序執行
(async () => {
  try {
    await scrapeAWSAnnouncements();
  } catch (error) {
    logger.error("執行更新程序時發生錯誤:", error);
    process.exit(1);
  }
})(); 