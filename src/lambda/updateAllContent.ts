import dotenv from 'dotenv';
import {
  DynamoDBClient,
  PutItemCommand,
  ScanCommand,
  AttributeValue,
  GetItemCommand
} from "@aws-sdk/client-dynamodb";
import * as puppeteer from "puppeteer";
import { v4 as uuidv4 } from "uuid";
import OpenAI from "openai";
import { logger } from "../utils/logger.js";
import { lineService } from "../services/lineService.js";
import { discordService } from "../services/discordService.js";
import { sendEmailWithRetry, failedNotifications, processFailedNotifications } from "../utils/notificationUtils.js";
import { DISCORD_CONFIG, DISCORD_MESSAGE_TEMPLATES } from '../config/discord';
import { DiscordNotificationType } from '../types/discordTypes';

// 通用介面定義
interface BaseContent {
  title: string;
  description?: string;
  info?: string;
  link: string;
}

interface ContentData {
  title: string;
  link: string;
  timestamp: string;
  summary: string;
}

interface NotificationUser {
  userId: { S: string };
  discordId?: { S: string };
  discordNotification?: { BOOL: boolean };
  emailNotification?: { BOOL: boolean };
  lineNotification?: { BOOL: boolean };
  email?: { S: string };
  lineId?: { S: string };
  webhookUrl?: { S: string };
}

interface FailedNotification {
  userId: string;
  articleId: string;
  type: string;
  error: string;
}

// 環境變數配置
dotenv.config({ path: ".env.local" });

// 常量定義
const FETCH_COUNTS = {
  announcement: 1, // 更新公告數量
  news: 0, // 更新新聞數量
  solutions: 0, // 更新解決方案數量
  architecture: 0, // 更新架構數量
  knowledge: 0, // 更新知識中心數量
};

const prompts = {
  news: (url: string) => `請用繁體中文簡潔扼要地總結這篇 AWS 部落格文章的主要內容（限 100 字以內）：${url}`,
  announcement: (url: string) => `請用繁體中文簡潔扼要地總結這篇 AWS 公告的主要內容（限 100 字以內）：${url}`,
  knowledge: (url: string) => `請用繁體中文簡潔扼要地總結這篇 AWS Knowledge Center 文章的主要內容（限 100 字以內）：${url}`,
  solutions: (url: string) => `請用繁體中文簡潔扼要地總結這個 AWS Solution 的主要內容（限 100 字以內）：${url}`,
  architecture: (url: string) => `請用繁體中文簡潔扼要地總結這個 AWS Architecture 的主要內容（限 100 字以內）：${url}`
};

// 初始化客戶端
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const dbClient = new DynamoDBClient({
  region: "ap-northeast-1",
});

// 在檔案開頭定義 StatsType
type StatsType = {
  [K in ContentType]: {
    inserted: number;
    skipped: number;
    failed: number;
    notifications: number;
    notificationsFailed: number;
  }
};

// 修改 stats 的宣告
const stats: StatsType = {
  announcement: { inserted: 0, skipped: 0, failed: 0, notifications: 0, notificationsFailed: 0 },
  news: { inserted: 0, skipped: 0, failed: 0, notifications: 0, notificationsFailed: 0 },
  solutions: { inserted: 0, skipped: 0, failed: 0, notifications: 0, notificationsFailed: 0 },
  architecture: { inserted: 0, skipped: 0, failed: 0, notifications: 0, notificationsFailed: 0 },
  knowledge: { inserted: 0, skipped: 0, failed: 0, notifications: 0, notificationsFailed: 0 }
};

// 在檔案開頭新增這些常量
const CONTENT_TYPES = {
  announcement: { name: '最新公告', emoji: '📢' },
  news: { name: '最新新聞', emoji: '📰' },
  solutions: { name: '解決方案', emoji: '💡' },
  architecture: { name: '架構參考', emoji: '🏗️' },
  knowledge: { name: '知識中心', emoji: '📚' }
};

// 新增一個型別來定義允許的內容類型
type ContentType = 'announcement' | 'news' | 'solutions' | 'architecture' | 'knowledge';

// 標題格式化函數
function formatTitle(title: string): string {
  return '【' + title + '】';
}

// 通用功能函數
async function checkIfExists(title: string, tableName: string): Promise<boolean | string> {
  const scanParams = {
    TableName: tableName,
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
    logger.error(`檢查內容存在時發生錯誤 (${tableName}):`, error);
    return false;
  }
}

async function summarizeContent(url: string, type: keyof typeof prompts): Promise<string> {
  const prompt = `${prompts[type](url)}
要求：
1. 直接說明主要內容
2. 只提及關鍵技術點或解決方案
3. 避免贅詞`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 200,
    });
    return response.choices[0]?.message?.content?.trim() || "無法獲取總結";
  } catch (error) {
    logger.error(`總結內容時發生錯誤 (${type}):`, error);
    return "無法獲取總結";
  }
}

async function translateText(text: string): Promise<string> {
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

    return response.choices[0]?.message?.content?.trim() || text;
  } catch (error) {
    logger.error('翻譯時發生錯誤:', error);
    return text;
  }
}

async function saveToDynamoDB(
  content: BaseContent,
  type: keyof typeof stats,
  tableName: string
): Promise<boolean> {
  const exists = await checkIfExists(content.title, tableName);
  if (exists) {
    stats[type].skipped++;
    const { emoji } = CONTENT_TYPES[type as keyof typeof CONTENT_TYPES];
    logger.info(`   ${emoji} 內容已存在，跳過: ${content.title}`);
    return false;
  }

  const summary = await summarizeContent(content.link, type);
  const translatedTitle = await translateText(content.title);
  const translatedDescription = content.description ? 
    await translateText(content.description) : '';

  const contentId = uuidv4();
  const timestamp = Math.floor(Date.now() / 1000);
  const chineseDateFormat = timestampToChineseDate(timestamp);

  const params = {
    TableName: tableName,
    Item: {
      article_id: { S: contentId },
      title: { S: content.title },
      translated_title: { S: translatedTitle },
      link: { S: content.link },
      summary: { S: summary },
      created_at: { N: String(timestamp) },
      info: { S: chineseDateFormat },
      ...(content.description && { description: { S: content.description } }),
      ...(translatedDescription && { translated_description: { S: translatedDescription } }),
    },
  };

  try {
    await dbClient.send(new PutItemCommand(params));
    stats[type].inserted++;

    const { emoji } = CONTENT_TYPES[type as keyof typeof CONTENT_TYPES];
    logger.info(`   ${emoji} 成功處理內容：${translatedTitle}`);

    const contentData: ContentData = {
      title: translatedTitle,
      link: content.link,
      timestamp: String(timestamp),
      summary: summary
    };

    await broadcastNewContent(contentId, type);

    return true;
  } catch (error) {
    stats[type].failed++;
    logger.error(`儲存 ${type} 失敗:`, error);
    throw error;
  }
}

// 爬蟲相關函數
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
      logger.warn(`加載失敗，重試 ${i + 1}/${retries} 次...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
}

// 在檔案開頭新增日期轉換函數
function convertDateFormat(dateStr: string): string {
  try {
    const [month, day, year] = dateStr.split('/');
    return `${year}年${month}月${day}日`;
  } catch (error) {
    logger.error('日期格式轉換失敗:', error);
    return dateStr;
  }
}

// 在檔案中新增這個日期提取函數
function extractDate(info: string): string {
  const dateMatch = info.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
  if (dateMatch) {
    return dateMatch[0];
  }
  return info;
}

// 新增一個日期轉換的輔助函數
function timestampToChineseDate(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}年${month}月${day}日`;
}

// 各類型內容的爬蟲函數
async function scrapeNews(browser: puppeteer.Browser): Promise<void> {
  const { name, emoji } = CONTENT_TYPES.news;
  
  const page = await browser.newPage();
  try {
    await gotoWithRetry(page, "https://aws.amazon.com/blogs/", {
      waitUntil: "networkidle2",
      timeout: 60000,
    });
    
    const articles = await page.evaluate((count) => {
      const titles = document.querySelectorAll(".m-card-title");
      const infos = document.querySelectorAll(".m-card-info");
      const descriptions = document.querySelectorAll(".m-card-description");
      const links = document.querySelectorAll(".m-card-title a");

      return Array.from(titles)
        .slice(0, count)
        .map((titleElem, index) => {
          const infoText = (infos[index] as HTMLElement)?.innerText || "沒有資訊";
          // 提取日期，格式為：作者名稱, MM/DD/YYYY
          const dateMatch = infoText.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
          let formattedDate = infoText;
          
          if (dateMatch) {
            const [_, month, day, year] = dateMatch;
            formattedDate = `${year}年${month}月${day}日`;
          }
          
          return {
            title: (titleElem as HTMLElement).innerText || "沒有標題",
            info: formattedDate,
            description: (descriptions[index] as HTMLElement)?.innerText || "沒有描述",
            link: (links[index] as HTMLAnchorElement)?.href || "沒有連結",
          };
        });
    }, FETCH_COUNTS.news);

    // 確保 articles 是陣列
    if (!Array.isArray(articles)) {
      logger.error(`   ${emoji} 【${name}】爬取的資料格式不正確`);
      return;
    }

    for (const article of articles) {
      await saveToDynamoDB(article, 'news', 'AWS_Blog_News');
    }
  } catch (error) {
    logger.error(`   ${emoji} 【${name}】爬取失敗`);
    logger.error(`   ${error}`);
  }
}

async function scrapeAnnouncement(browser: puppeteer.Browser): Promise<void> {
  const { name, emoji } = CONTENT_TYPES.announcement;
  
  const page = await browser.newPage();
  try {
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9'
    });

    await gotoWithRetry(
      page,
      "https://aws.amazon.com/about-aws/whats-new/?whats-new-content-all.sort-by=item.additionalFields.postDateTime&whats-new-content-all.sort-order=desc&awsf.whats-new-categories=*all",
      {
        waitUntil: "networkidle2",
        timeout: 60000,
      }
    );

    const announcements = await page.evaluate((fetchCount) => {
      const cards = document.querySelectorAll('.m-card');
      const results = [];

      for (let i = 0; i < Math.min(fetchCount, cards.length); i++) {
        const card = cards[i];
        const titleElement = card.querySelector('.m-card-title');
        const infoElement = card.querySelector('.m-card-info');
        const linkElement = card.querySelector('.m-card-title a');

        if (titleElement && linkElement) {
          const href = linkElement.getAttribute('href') || "";
          // 組合完整的 URL
          const fullUrl = href.startsWith('http') ? href : `https://aws.amazon.com${href}`;
          
          results.push({
            title: titleElement.textContent?.trim() || "沒有標題",
            info: infoElement?.textContent?.trim() || "沒有日期",
            link: fullUrl
          });
        }
      }

      return results;
    }, FETCH_COUNTS.announcement);

    for (const announcement of announcements) {
      // 轉換日期格式
      announcement.info = convertDateFormat(announcement.info);
      await saveToDynamoDB(announcement, 'announcement', 'AWS_Blog_Announcement');
    }
  } catch (error) {
    logger.error(`   ${emoji} 【${name}】爬取失敗`);
    logger.error(`   ${error}`);
  }
}

async function scrapeKnowledge(browser: puppeteer.Browser): Promise<void> {
  const page = await browser.newPage();
  try {
    page.setDefaultTimeout(30000);
    page.setDefaultNavigationTimeout(30000);

    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36'
    });

    await gotoWithRetry(
      page,
      'https://repost.aws/knowledge-center/all?view=all&sort=recent',
      {
        waitUntil: 'networkidle0',
        timeout: 60000,
      }
    );

    await page.waitForSelector('.KCArticleCard_card__HW_gu', { timeout: 30000 });

    const articles = await page.evaluate(() => {
      const items = document.querySelectorAll('.KCArticleCard_card__HW_gu');
      return Array.from(items).slice(0, 5).map(item => {
        const titleElement = item.querySelector('.KCArticleCard_title__dhRk_ a');
        const descriptionElement = item.querySelector('.KCArticleCard_descriptionBody__hLZPL a');
        
        const link = titleElement?.getAttribute('href') || '沒有連結';
        const description = descriptionElement?.textContent?.trim() || '沒有描述';
        
        return { title: '', description, link, info: '' };
      });
    });

    for (const article of articles.slice(0, FETCH_COUNTS.knowledge)) {
      if (!article.link.startsWith('http')) {
        article.link = `https://repost.aws${article.link}`;
      }

      try {
        await gotoWithRetry(
          page,
          article.link,
          {
            waitUntil: 'networkidle0',
            timeout: 30000,
          }
        );
        
        await page.waitForSelector('.KCArticleView_title___TWq1 h1');
        
        article.title = await page.$eval('.KCArticleView_title___TWq1 h1', 
          (element) => element.textContent?.trim() || '沒有標題'
        );

        // 加入時間戳並轉換為中文日期格式
        const timestamp = Math.floor(Date.now() / 1000);
        article.info = timestampToChineseDate(timestamp);
        
        await saveToDynamoDB(article, 'knowledge', 'AWS_Blog_Knowledge');
      } catch (error) {
        logger.error(`爬取知識文章標題時發生錯誤 (${article.link}):`, error);
      }
    }
  } catch (error) {
    logger.error("爬取知識中心時發生錯誤:", error);
  }
}

async function scrapeSolutions(browser: puppeteer.Browser): Promise<void> {
  const page = await browser.newPage();
  try {
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9'
    });

    await gotoWithRetry(
      page,
      'https://aws.amazon.com/solutions/',
      {
        waitUntil: 'networkidle2',
        timeout: 60000,
      }
    );

    const cards = await page.$$('.m-card-container');
    const solutions = [];

    for (const card of cards.slice(0, FETCH_COUNTS.solutions)) {
      await card.hover();
      await new Promise(resolve => setTimeout(resolve, 500));

      const solution = await card.evaluate((el) => {
        const descElement = el.querySelector('.m-desc p') || el.querySelector('.m-desc');
        return {
          title: el.querySelector('.m-headline a')?.textContent?.trim() || '沒有標題',
          description: descElement?.textContent?.trim() || '沒有描述',
          link: (el.querySelector('.m-headline a') as HTMLAnchorElement)?.href || '沒有連結',
          info: ''
        };
      });

      // 加入時間戳並轉換為中文日期格式
      const timestamp = Math.floor(Date.now() / 1000);
      solution.info = timestampToChineseDate(timestamp);

      solutions.push(solution);
    }

    for (const solution of solutions) {
      await saveToDynamoDB(solution, 'solutions', 'AWS_Blog_Solutions');
    }
  } catch (error) {
    logger.error("爬取解決方案時發生錯誤:", error);
  }
}

async function scrapeArchitecture(browser: puppeteer.Browser): Promise<void> {
  const page = await browser.newPage();
  try {
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9'
    });

    await gotoWithRetry(
      page,
      'https://aws.amazon.com/architecture/?cards-all.sort-by=item.additionalFields.sortDate&cards-all.sort-order=desc&awsf.content-type=content-type%23reference-arch-diagram&awsf.methodology=*all&awsf.tech-category=*all&awsf.industries=*all&awsf.business-category=*all',
      {
        waitUntil: 'networkidle2',
        timeout: 60000,
      }
    );

    const cards = await page.$$('.m-card-container');
    const architectures = [];

    for (const card of cards.slice(0, FETCH_COUNTS.architecture)) {
      await card.hover();
      await new Promise(resolve => setTimeout(resolve, 500));

      const architecture = await card.evaluate((el) => {
        const descElement = el.querySelector('.m-desc');
        let description = '';
        
        if (descElement) {
          // 處理第一種情況：直接文字節點
          const textNodes = Array.from(descElement.childNodes)
            .filter(node => node.nodeType === Node.TEXT_NODE);
          
          if (textNodes.length > 0) {
            description = textNodes[0]?.textContent?.trim() || '';
          }
          
          // 如果沒有直接文字節點，處理第二種情況：<p>標籤內的文字
          if (!description) {
            const firstP = descElement.querySelector('p');
            if (firstP) {
              description = firstP.textContent?.trim() || '';
            }
          }
        }

        return {
          title: el.querySelector('.m-headline a')?.textContent?.trim() || '沒有標題',
          description: description || '沒有描述',
          link: (el.querySelector('.m-headline a') as HTMLAnchorElement)?.href || '沒有連結',
          info: ''
        };
      });

      // 加入時間戳並轉換為中文日期格式
      const timestamp = Math.floor(Date.now() / 1000);
      architecture.info = timestampToChineseDate(timestamp);

      architectures.push(architecture);
    }

    for (const architecture of architectures) {
      await saveToDynamoDB(architecture, 'architecture', 'AWS_Blog_Architecture');
    }
  } catch (error) {
    logger.error("爬取架構時發生錯誤:", error);
  }
}

// 通知相關函數
async function sendNotifications(
  type: ContentType,
  article: ContentData,
  users: NotificationUser[]
): Promise<void> {
  try {
    const discordUsers = users.filter(user => 
      user.discordNotification?.BOOL && 
      user.discordId?.S
    );
    
    if (discordUsers.length > 0) {
      const notificationType = mapTypeToNotificationType(type);
      
      for (const user of discordUsers) {
        if (!user.discordId?.S) continue;
        
        try {
          const success = await discordService.sendNotification(
            user.discordId.S,
            notificationType,
            article.title,
            article.summary,
            article.link
          );

          if (success) {
            stats[type].notifications++;
            logger.info(`成功發送 Discord 通知給用戶 ${user.userId.S}`);
          } else {
            stats[type].notificationsFailed++;
            logger.error(`發送 Discord 通知失敗 (用戶 ID: ${user.userId.S})`);
          }
        } catch (error) {
          stats[type].notificationsFailed++;
          logger.error(`發送 Discord 通知失敗 (用戶 ID: ${user.userId.S}):`, error);
          failedNotifications.push({
            userId: user.userId.S,
            articleId: article.link,
            type: 'discord',
            error: error instanceof Error ? error.message : '未知錯誤'
          });
        }
      }
    }
  } catch (error) {
    logger.error('發送通知時發生錯誤:', error);
    throw error;
  }
}

// 其他輔助函數
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
    FilterExpression: "attribute_exists(userId) AND (attribute_not_exists(is_deleted) OR is_deleted = :false)",
    ExpressionAttributeValues: {
      ":false": { BOOL: false }
    },
    ProjectionExpression: "userId"
  };

  try {
    const command = new ScanCommand(params);
    const response = await dbClient.send(command);
    const userIds = response.Items?.map((item) => item.userId.S as string) || [];
    logger.info(`成功獲取 ${userIds.length} 個活躍用戶`);
    return userIds;
  } catch (error) {
    logger.error("獲取用戶 ID 時發生錯誤:", error);
    return [];
  }
}

async function addNotification(
  userId: string, 
  contentId: string, 
  category: string
): Promise<void> {
  const params = {
    TableName: "AWS_Blog_UserNotifications",
    Item: {
      notification_id: { S: uuidv4() },  // 使用 UUID 產生唯一的 notification_id
      userId: { S: userId },
      article_id: { S: contentId },
      read: { BOOL: false },
      created_at: { N: String(Math.floor(Date.now() / 1000)) },
      category: { S: category },
      is_deleted: { BOOL: false }
    }
  };

  try {
    await dbClient.send(new PutItemCommand(params));
    logger.info(`成功新增通知：
   👤 用戶ID：${userId}
   📄 文章ID：${contentId}
   📑 分類：${category}
   🆔 通知ID：${params.Item.notification_id.S}`);
  } catch (error) {
    logger.error("新增通知失敗:", error);
    throw error;
  }
}

// 在檔案開頭新增 Discord webhook 檢查函數
async function validateDiscordWebhook(webhookUrl: string): Promise<boolean> {
  try {
    const response = await fetch(webhookUrl);
    return response.ok;
  } catch (error) {
    logger.error('檢查 Discord webhook 失敗:', error);
    return false;
  }
}

async function getEmailNotificationUsers(): Promise<NotificationUser[]> {
  const params = {
    TableName: "AWS_Blog_UserNotificationSettings",
    FilterExpression: "emailNotification = :true",
    ExpressionAttributeValues: {
      ":true": { BOOL: true },
    },
  };

  try {
    const command = new ScanCommand(params);
    const response = await dbClient.send(command);
    return (response.Items || []).map(item => ({
      userId: { S: item.userId.S || '' },
      email: { S: item.email.S || '' },
      emailNotification: { BOOL: true }
    }));
  } catch (error) {
    logger.error("獲取電子郵件通知用戶時發生錯誤:", error);
    return [];
  }
}

// 修改 broadcastNewContent 函數
async function broadcastNewContent(contentId: string, type: ContentType): Promise<void> {
  try {
    const content = await getContentDetails(contentId, type);
    if (!content || !content.title || !content.summary || !content.link) {
      logger.error('內容資訊不完整，跳過通知發送');
      return;
    }

    const notificationType = mapTypeToNotificationType(type);
    const { title, summary, link } = content;

    // 獲取所有用戶 ID
    const allUserIds = await getAllUserIds();
    
    // 為每個用戶新增通知記錄
    for (const userId of allUserIds) {
      try {
        await addNotification(userId, contentId, type);
        logger.info(`成功新增通知記錄：用戶 ${userId}, \n內容 ${contentId}`);
      } catch (error) {
        logger.error(`新增通知記錄失敗 (用戶 ID: ${userId}):`, error);
      }
    }

    // 獲取啟用電子郵件通知的用戶
    const emailUsers = await getEmailNotificationUsers();
    logger.info(`找到 ${emailUsers.length} 個有效的電子郵件通知用戶`);

    // 發送電子郵件通知
    for (const user of emailUsers) {
      if (!user.email?.S) {
        logger.warn(`用戶 ${user.userId.S} 缺少電子郵件地址，跳過通知`);
        continue;
      }

      try {
        const emailContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2c5282;">AWS 部落格新文章通知</h2>
            <div style="padding: 20px; background-color: #f7fafc; border-radius: 8px;">
              <h3 style="color: #4a5568;">${title}</h3>
              <p style="color: #718096;">${summary}</p>
              <a href="${link}" 
                 style="display: inline-block; padding: 10px 20px; 
                        background-color: #4299e1; color: white; 
                        text-decoration: none; border-radius: 5px; 
                        margin-top: 15px;">
                閱讀全文
              </a>
            </div>
          </div>
        `;

        await sendEmailWithRetry({
          to: user.email.S,
          subject: `AWS 部落格新${CONTENT_TYPES[type].name}通知`,
          html: emailContent
        });

        stats[type].notifications++;
        logger.info(`成功發送電子郵件通知給用戶 ${user.userId.S}`);
      } catch (error) {
        stats[type].notificationsFailed++;
        logger.error(`發送電子郵件通知失敗 (用戶 ID: ${user.userId.S}):`, error);
        
        failedNotifications.push({
          userId: user.userId.S,
          articleId: contentId,
          type: 'email',
          error: error instanceof Error ? error.message : '未知錯誤',
          email: user.email.S
        });
      }
    }

    // 獲取啟用 Discord 通知的用戶
    const discordUsers = await getDiscordNotificationUsers();
    logger.info(`找到 ${discordUsers.length} 個有效的 Discord 通知用戶`);
    
    // 發送 Discord 通知
    for (const user of discordUsers) {
      if (!user.discordId?.S) {
        logger.warn(`用戶 ${user.userId.S} 缺少 Discord ID，跳過通知`);
        continue;
      }
      
      try {
        const success = await discordService.sendNotification(
          user.discordId.S,
          notificationType,
          title,
          summary,
          link
        );

        if (success) {
          stats[type].notifications++;
          logger.info(`成功發送 Discord 通知給用戶 ${user.userId.S}`);
        } else {
          stats[type].notificationsFailed++;
          logger.error(`發送 Discord 通知失敗 (用戶 ID: ${user.userId.S})`);
          
          failedNotifications.push({
            userId: user.userId.S,
            articleId: contentId,
            type: 'discord',
            error: 'Discord 通知發送失敗'
          });
        }
      } catch (error) {
        stats[type].notificationsFailed++;
        logger.error(`發送 Discord 通知時發生錯誤 (用戶 ID: ${user.userId.S}):`, error);
        
        failedNotifications.push({
          userId: user.userId.S,
          articleId: contentId,
          type: 'discord',
          error: error instanceof Error ? error.message : '未知錯誤'
        });
      }
    }

    // 處理失敗的通知
    if (failedNotifications.length > 0) {
      logger.info(`開始處理 ${failedNotifications.length} 個失敗的通知`);
      await processFailedNotifications();
    }

  } catch (error) {
    logger.error('廣播新內容時發生錯誤:', error);
    throw error;
  }
}

// 新增輔助函數來獲取內容詳細資訊
async function getContentDetails(contentId: string, type: ContentType) {
  const tableName = `AWS_Blog_${type.charAt(0).toUpperCase() + type.slice(1)}`;
  const params = {
    TableName: tableName,
    Key: {
      article_id: { S: contentId }
    }
  };

  try {
    const command = new GetItemCommand(params);
    const result = await dbClient.send(command);
    
    if (!result.Item) {
      return null;
    }

    return {
      title: result.Item.translated_title?.S || result.Item.title?.S,
      summary: result.Item.summary?.S,
      link: result.Item.link?.S
    };
  } catch (error) {
    logger.error('獲取內容詳細資訊失敗:', error);
    return null;
  }
}

// 修改日誌輸出格式
function logUpdateResult(type: string, result: { inserted: number, skipped: number, failed: number, notifications: number, notificationsFailed: number }) {
  const { name, emoji } = CONTENT_TYPES[type as keyof typeof CONTENT_TYPES];
  const total = result.inserted + result.skipped + result.failed;
  
  const boxWidth = 62;
  const line = '─'.repeat(boxWidth - 2);
  
  logger.info(`┌${line}┐`);
  logger.info(`│ ${emoji} ${formatTitle(name)}${' '.repeat(boxWidth - name.length - emoji.length - 5)}`);
  logger.info(`├${line}┤`);
  logger.info(`│ ✨ 新增內容：${result.inserted}${' '.repeat(boxWidth - 13 - result.inserted.toString().length)}`);
  logger.info(`│ ⏭️  跳過內容：${result.skipped}${' '.repeat(boxWidth - 13 - result.skipped.toString().length)}`);
  logger.info(`│ ❌ 失敗內容：${result.failed}${' '.repeat(boxWidth - 13 - result.failed.toString().length)}`);
  logger.info(`│ 👥 通知數量：${result.notifications}${' '.repeat(boxWidth - 13 - result.notifications.toString().length)}`);
  logger.info(`│ 📊 通知失敗：${result.notificationsFailed}${' '.repeat(boxWidth - 13 - result.notificationsFailed.toString().length)}`);
  logger.info(`│ 📊 處理總數：${total}${' '.repeat(boxWidth - 13 - total.toString().length)}`);
  logger.info(`└${line}┘`);

  if (result.failed > 0 || result.notificationsFailed > 0) {
    const warningMsg = `⚠️  注意：${formatTitle(name)}有 ${result.failed} 筆內容處理失敗，${result.notificationsFailed} 筆通知發送失敗`;
    logger.warn(`┌${line}┐`);
    logger.warn(`│ ${warningMsg}${' '.repeat(boxWidth - warningMsg.length - 3)}│`);
    logger.warn(`└${line}┘`);
  }
}

// 修改進度追蹤函數
function logProgress(type: string, current: number, total: number, action: string) {
  const { name, emoji } = CONTENT_TYPES[type as keyof typeof CONTENT_TYPES];
  const percentage = Math.round((current / total) * 100);
  const progressBar = '█'.repeat(Math.floor(percentage / 5)) + '░'.repeat(20 - Math.floor(percentage / 5));
  
  const boxWidth = 62;
  const line = '─'.repeat(boxWidth - 2);
  
  logger.info(`┌${line}┐`);
  logger.info(`│ ${emoji} ${name} - ${action}${' '.repeat(boxWidth - emoji.length - name.length - action.length - 5)}│`);
  logger.info(`│ ${progressBar} ${percentage}% (${current}/${total})${' '.repeat(boxWidth - progressBar.length - percentage.toString().length - current.toString().length - total.toString().length - 9)}│`);
  logger.info(`└${line}┘`);
}

// 修改映射函數
function mapTypeToNotificationType(type: ContentType): DiscordNotificationType {
  const typeMap: Record<ContentType, DiscordNotificationType> = {
    announcement: "ANNOUNCEMENT",
    news: "NEWS",
    solutions: "SOLUTIONS",
    architecture: "ARCHITECTURE",
    knowledge: "KNOWLEDGE"
  };

  return typeMap[type];
}

// 修改獲取 Discord 通知用戶的函數
async function getDiscordNotificationUsers(): Promise<NotificationUser[]> {
  try {
    const params = {
      TableName: "AWS_Blog_UserNotificationSettings",
      FilterExpression: "discordNotification = :enabled",
      ExpressionAttributeValues: {
        ":enabled": { BOOL: true }
      },
      ProjectionExpression: "userId, discordId, discordNotification"
    };

    const data = await dbClient.send(new ScanCommand(params));
    
    if (!data.Items || data.Items.length === 0) {
      logger.info('沒有啟用 Discord 通知的用戶');
      return [];
    }

    const validUsers = data.Items.filter(item => {
      const discordId = item.discordId?.S;
      if (!discordId) {
        logger.warn(`用戶 ${item.userId.S} 缺少 Discord ID`);
        return false;
      }
      return true;
    });

    return validUsers as unknown as NotificationUser[];
  } catch (error) {
    logger.error('獲取 Discord 通知用戶失敗:', error);
    return [];
  }
}

// 修改主要的爬取函數
async function scrapeContent(browser: puppeteer.Browser, type: ContentType, articles: ContentData[]) {
  // 獲取啟用通知的用戶
  const notificationUsers = await getDiscordNotificationUsers();

  // 發送通知
  if (notificationUsers.length > 0) {
    for (const article of articles) {
      await sendNotifications(type, article, notificationUsers);
    }
  }
}

// 修改主程序的日誌輸出
export async function updateAllContent(): Promise<void> {
  let browser: puppeteer.Browser | null = null;
  const startTime = Date.now();
  const boxWidth = 62;
  const line = '─'.repeat(boxWidth - 2);

  try {
    logger.info(`┌${line}┐`);
    logger.info(`│ 🚀 AWS 爬取文章程序開始${' '.repeat(boxWidth - 20)}`);
    logger.info(`│ 📅 執行時間：${new Date().toLocaleString()}${' '.repeat(boxWidth - new Date().toLocaleString().length - 8)}`);
    logger.info(`└${line}┘`);
    
    browser = await puppeteer.launch({ 
      headless: true,
      args: ['--incognito', '--no-sandbox', '--disable-setuid-sandbox']
    });
    
    // 依序執行各項爬取任務
    const tasks = [
      { fn: scrapeAnnouncement, type: 'announcement' },  // 最新公告
      { fn: scrapeNews, type: 'news' },                 // 最新新聞
      { fn: scrapeSolutions, type: 'solutions' },       // 解決方案
      { fn: scrapeArchitecture, type: 'architecture' }, // 架構參考
      { fn: scrapeKnowledge, type: 'knowledge' }        // 知識中心
    ];

    for (const task of tasks) {
      const { name, emoji } = CONTENT_TYPES[task.type as keyof typeof CONTENT_TYPES];
      logger.info('┌' + '─'.repeat(60) + '┐');
      logger.info(`│ ${emoji} 開始處理【${name}】${' '.repeat(60 - emoji.length - name.length - 6)}`);
      logger.info('└' + '─'.repeat(60) + '┘');
      
      await task.fn(browser);
    }

    // 輸出總結報告
    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);
    
    logger.info(`┌${line}┐`);
    logger.info(`│ 📊 更新執行總結${' '.repeat(boxWidth - 10)}`);
    logger.info(`├${line}┤`);
    
    const reportOrder = ['announcement', 'news', 'solutions', 'architecture', 'knowledge'];
    reportOrder.forEach(type => {
      logUpdateResult(type, stats[type as keyof typeof stats]);
    });

    const totalInserted = Object.values(stats).reduce((sum, count) => sum + count.inserted, 0);
    const totalSkipped = Object.values(stats).reduce((sum, count) => sum + count.skipped, 0);
    const totalFailed = Object.values(stats).reduce((sum, count) => sum + count.failed, 0);
    const totalNotifications = Object.values(stats).reduce((sum, count) => sum + count.notifications, 0);
    const totalNotificationsFailed = Object.values(stats).reduce((sum, count) => sum + count.notificationsFailed, 0);
    
    logger.info(`│ ✨ 總更新數量：${totalInserted}${' '.repeat(boxWidth - 13 - totalInserted.toString().length)}│`);
    logger.info(`│ ⏭️  總跳過數量：${totalSkipped}${' '.repeat(boxWidth - 13 - totalSkipped.toString().length)}│`);
    logger.info(`│ ❌ 總失敗數量：${totalFailed}${' '.repeat(boxWidth - 13 - totalFailed.toString().length)}│`);
    logger.info(`│ 👥 總通知數量：${totalNotifications}${' '.repeat(boxWidth - 13 - totalNotifications.toString().length)}│`);
    logger.info(`│ 🕒 通知失敗總數：${totalNotificationsFailed}${' '.repeat(boxWidth - 15 - totalNotificationsFailed.toString().length)}│`);
    logger.info(`│ 🕒 執行時間：${duration} 秒${' '.repeat(boxWidth - 14 - duration.toString().length)}│`);
    logger.info(`└${line}┘`);

    if (totalFailed > 0 || totalNotificationsFailed > 0) {
      const warningMsg = `⚠️  注意：總共有 ${totalFailed} 筆內容處理失敗，${totalNotificationsFailed} 筆通知發送失敗`;
      logger.warn(`┌${line}┐`);
      logger.warn(`│ ${warningMsg}${' '.repeat(boxWidth - warningMsg.length - 3)}│`);
      logger.warn(`└${line}┘`);
    }

    logger.info(`┌${line}┐`);
    logger.info(`│ ✅ 所有更新程序已完成${' '.repeat(boxWidth - 14)}`);
    logger.info(`└${line}┘`);

  } catch (error) {
    logger.error(`┌${line}┐`);
    logger.error(`│ ❌ 執行更新程序時發生錯誤${' '.repeat(boxWidth - 16)}`);
    logger.error(`└${line}┘`);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

const isDirectlyExecuted = process.argv[1] ? import.meta.url.includes(process.argv[1]) : false;

if (isDirectlyExecuted) {
  (async () => {
    try {
      await updateAllContent();
    } catch (error) {
      logger.error("程序執行失敗:", error);
      process.exit(1);
    }
  })();
}