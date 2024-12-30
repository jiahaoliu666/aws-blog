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
  email: { S: string };
}

// 環境變數配置
dotenv.config({ path: ".env.local" });

// 常量定義
const FETCH_COUNTS = {
  news: 1, // 更新新聞數量
  announcement: 1, // 更新公告數量
  knowledge: 1, // 更新知識中心數量
  solutions: 1, // 更新解決方案數量
  architecture: 1 // 更新架構數量
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

// 統計計數器
const stats = {
  news: { inserted: 0, skipped: 0, failed: 0 },
  announcement: { inserted: 0, skipped: 0, failed: 0 },
  knowledge: { inserted: 0, skipped: 0, failed: 0 },
  solutions: { inserted: 0, skipped: 0, failed: 0 },
  architecture: { inserted: 0, skipped: 0, failed: 0 }
};

// 在檔案開頭新增這些常量
const CONTENT_TYPES = {
  news: { name: '最新新聞', emoji: '📰' },
  announcement: { name: '最新公告', emoji: '📢' },
  knowledge: { name: '知識中心', emoji: '📚' },
  solutions: { name: '解決方案', emoji: '💡' },
  architecture: { name: '架構參考', emoji: '🏗️' }
};

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
    logger.info(`${type} 內容已存在，跳過: ${content.title}`);
    return false;
  }

  const summary = await summarizeContent(content.link, type);
  const translatedTitle = await translateText(content.title);
  const translatedDescription = content.description ? 
    await translateText(content.description) : '';

  const contentId = uuidv4();
  const params = {
    TableName: tableName,
    Item: {
      article_id: { S: contentId },
      title: { S: content.title },
      translated_title: { S: translatedTitle },
      link: { S: content.link },
      summary: { S: summary },
      created_at: { N: String(Math.floor(Date.now() / 1000)) },
      ...(content.description && { description: { S: content.description } }),
      ...(translatedDescription && { translated_description: { S: translatedDescription } }),
      ...(content.info && { info: { S: content.info } })
    },
  };

  try {
    await dbClient.send(new PutItemCommand(params));
    stats[type].inserted++;

    const contentData: ContentData = {
      title: translatedTitle,
      link: content.link,
      timestamp: Date.now().toString(),
      summary: summary
    };

    // 發送通知
    await sendNotifications(contentData, type);
    await broadcastNewContent(contentId, type);

    return true;
  } catch (error) {
    logger.error(`儲存 ${type} 內容時發生錯誤:`, error);
    return false;
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

// 各類型內容的爬蟲函數
async function scrapeNews(browser: puppeteer.Browser): Promise<void> {
  const { name, emoji } = CONTENT_TYPES.news;
  logger.info('┌' + '─'.repeat(60) + '┐');
  logger.info(`│ ${emoji} ${formatTitle(name)}爬取開始${' '.repeat(45 - name.length)}│`);
  logger.info('└' + '─'.repeat(60) + '┘');
  
  const page = await browser.newPage();
  try {
    logger.info(`   ⏳ 正在載入頁面...`);
    await gotoWithRetry(page, "https://aws.amazon.com/blogs/", {
      waitUntil: "networkidle2",
      timeout: 60000,
    });
    
    logger.info(`   🔍 正在解析內容...`);
    const articles = await page.evaluate((count) => {
      const titles = document.querySelectorAll(".m-card-title");
      const infos = document.querySelectorAll(".m-card-info");
      const descriptions = document.querySelectorAll(".m-card-description");
      const links = document.querySelectorAll(".m-card-title a");

      return Array.from(titles)
        .slice(0, count)
        .map((titleElem, index) => ({
          title: (titleElem as HTMLElement).innerText || "沒有標題",
          info: (infos[index] as HTMLElement)?.innerText || "沒有資訊",
          description: (descriptions[index] as HTMLElement)?.innerText || "沒有描述",
          link: (links[index] as HTMLAnchorElement)?.href || "沒有連結",
        }));
    }, FETCH_COUNTS.news);

    for (const article of articles) {
      await saveToDynamoDB(article, 'news', 'AWS_Blog_News');
    }
    
    logger.info('┌' + '─'.repeat(60) + '┐');
    logger.info(`│ ${emoji} ${formatTitle(name)}爬取完成${' '.repeat(45 - name.length)}│`);
    logger.info('└' + '─'.repeat(60) + '┘');
  } catch (error) {
    logger.error('┌' + '─'.repeat(60) + '┐');
    logger.error(`│ ${emoji} ${formatTitle(name)}爬取失敗${' '.repeat(45 - name.length)}│`);
    logger.error('└' + '─'.repeat(60) + '┘');
    logger.error(error as string);
  }
}

async function scrapeAnnouncement(browser: puppeteer.Browser): Promise<void> {
  const { name, emoji } = CONTENT_TYPES.announcement;
  logger.info('┌' + '─'.repeat(60) + '┐');
  logger.info(`│ ${emoji} ${formatTitle(name)}爬取開始${' '.repeat(45 - name.length)}│`);
  logger.info('└' + '─'.repeat(60) + '┘');
  
  const page = await browser.newPage();
  try {
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9'
    });

    await gotoWithRetry(
      page,
      "https://aws.amazon.com/about-aws/whats-new/",
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
          results.push({
            title: titleElement.textContent?.trim() || "沒有標題",
            info: infoElement?.textContent?.trim() || "沒有日期",
            link: linkElement.getAttribute('href') || "沒有連結"
          });
        }
      }

      return results;
    }, FETCH_COUNTS.announcement);

    for (const announcement of announcements) {
      await saveToDynamoDB(announcement, 'announcement', 'AWS_Blog_Announcement');
    }

    logger.info('┌' + '─'.repeat(60) + '┐');
    logger.info(`│ ${emoji} ${formatTitle(name)}爬取完成${' '.repeat(45 - name.length)}│`);
    logger.info('└' + '─'.repeat(60) + '┘');
  } catch (error) {
    logger.error('┌' + '─'.repeat(60) + '┐');
    logger.error(`│ ${emoji} ${formatTitle(name)}爬取失敗${' '.repeat(45 - name.length)}│`);
    logger.error('└' + '─'.repeat(60) + '┘');
    logger.error(error as string);
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
        
        return { title: '', description, link };
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

      const solution = await card.evaluate((el) => ({
        title: el.querySelector('.m-headline a')?.textContent?.trim() || '沒有標題',
        description: el.querySelector('.m-desc')?.textContent?.trim() || '沒有描述',
        link: (el.querySelector('.m-headline a') as HTMLAnchorElement)?.href || '沒有連結',
      }));

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

      const architecture = await card.evaluate((el) => ({
        title: el.querySelector('.m-headline a')?.textContent?.trim() || '沒有標題',
        description: el.querySelector('.m-desc')?.textContent?.trim() || '沒有描述',
        link: (el.querySelector('.m-headline a') as HTMLAnchorElement)?.href || '沒有連結',
      }));

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
async function sendNotifications(contentData: ContentData, type: string): Promise<void> {
  try {
    const lineUsers = await getLineNotificationUsers();
    if (lineUsers.length > 0 && process.env.LINE_CHANNEL_ACCESS_TOKEN) {
      switch (type) {
        case 'news':
          await lineService.sendNewsNotification(contentData);
          break;
        case 'announcement':
          await lineService.sendAnnouncementNotification(contentData);
          break;
        case 'knowledge':
          await lineService.sendKnowledgeNotification(contentData);
          break;
        case 'solutions':
          await lineService.sendSolutionNotification(contentData);
          break;
        case 'architecture':
          await lineService.sendSolutionNotification(contentData);
          break;
      }
      logger.info(`成功發送 LINE ${type} 通知給 ${lineUsers.length} 位用戶`);
    }
  } catch (error) {
    logger.warn(`LINE ${type} 通知發送失敗:`, error);
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

async function addNotification(
  userId: string, 
  contentId: string, 
  category: string
): Promise<void> {
  const params = {
    TableName: "AWS_Blog_UserNotifications",
    Item: {
      userId: { S: userId },
      article_id: { S: contentId },
      read: { BOOL: false },
      created_at: { N: String(Math.floor(Date.now() / 1000)) },
      category: { S: category }
    }
  };

  try {
    await dbClient.send(new PutItemCommand(params));
    logger.info(`成功新增通知: userId=${userId}, content_id=${contentId}, category=${category}`);
  } catch (error) {
    logger.error("新增通知失敗:", error);
    throw error;
  }
}

async function broadcastNewContent(contentId: string, type: string): Promise<void> {
  try {
    const users = await getAllUserIds();
    for (const userId of users) {
      await addNotification(userId, contentId, type);
    }
  } catch (error) {
    logger.error(`廣播新${type}通知時發生錯誤:`, error);
  }
}

// 新增進度追蹤函數
function logProgress(type: string, current: number, total: number, action: string) {
  const { name, emoji } = CONTENT_TYPES[type as keyof typeof CONTENT_TYPES];
  const percentage = Math.round((current / total) * 100);
  const progressBar = '█'.repeat(Math.floor(percentage / 5)) + '░'.repeat(20 - Math.floor(percentage / 5));
  logger.info(`${emoji} ${name} - ${action}`);
  logger.info(`   進度：${progressBar} ${percentage}% (${current}/${total})`);
}

// 新增標題格式化函數
function formatTitle(title: string): string {
  return '【' + title + '】';
}

// 修改日誌輸出格式
function logUpdateResult(type: string, result: { inserted: number, skipped: number, failed: number }) {
  const { name, emoji } = CONTENT_TYPES[type as keyof typeof CONTENT_TYPES];
  const total = result.inserted + result.skipped + result.failed;
  
  logger.info('┌' + '─'.repeat(60) + '┐');
  logger.info(`│ ${emoji} ${formatTitle(name)}${' '.repeat(45 - name.length)}│`);
  logger.info('├' + '─'.repeat(60) + '┤');
  logger.info(`│ ✨ 新增內容：${result.inserted.toString().padEnd(47)}│`);
  logger.info(`│ ⏭️  跳過內容：${result.skipped.toString().padEnd(46)}│`);
  logger.info(`│ ❌ 失敗內容：${result.failed.toString().padEnd(47)}│`);
  logger.info(`│ 📊 處理總數：${total.toString().padEnd(47)}│`);
  logger.info('└' + '─'.repeat(60) + '┘');

  if (result.failed > 0) {
    logger.warn(`⚠️  注意：${formatTitle(name)}有 ${result.failed} 筆內容處理失敗`);
  }
}

// 修改主程序的日誌輸出
export async function updateAllContent(): Promise<void> {
  let browser: puppeteer.Browser | null = null;
  const startTime = Date.now();

  try {
    logger.info('┌' + '─'.repeat(60) + '┐');
    logger.info(`│ 🚀 AWS 內容更新程序開始${' '.repeat(41)}│`);
    logger.info(`│ 📅 執行時間：${new Date().toLocaleString().padEnd(43)}│`);
    logger.info('└' + '─'.repeat(60) + '┘');
    
    browser = await puppeteer.launch({ 
      headless: true,
      args: ['--incognito', '--no-sandbox', '--disable-setuid-sandbox']
    });
    
    logger.info("🌐 瀏覽器初始化完成");
    
    // 依序執行各項爬取任務
    const tasks = [
      { fn: scrapeNews, type: 'news' },
      { fn: scrapeAnnouncement, type: 'announcement' },
      { fn: scrapeKnowledge, type: 'knowledge' },
      { fn: scrapeSolutions, type: 'solutions' },
      { fn: scrapeArchitecture, type: 'architecture' }
    ];

    for (const task of tasks) {
      const { name, emoji } = CONTENT_TYPES[task.type as keyof typeof CONTENT_TYPES];
      logger.info('┌' + '─'.repeat(60) + '┐');
      logger.info(`│ ${emoji} 開始處理${formatTitle(name)}${' '.repeat(45 - name.length)}│`);
      logger.info('└' + '─'.repeat(60) + '┘');
      
      await task.fn(browser);
    }

    // 輸出總結報告
    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);
    
    logger.info('┌' + '─'.repeat(60) + '┐');
    logger.info(`│ 📊 更新執行總結${' '.repeat(47)}│`);
    logger.info('├' + '─'.repeat(60) + '┤');
    
    Object.entries(stats).forEach(([type, count]) => {
      logUpdateResult(type, count);
    });

    const totalInserted = Object.values(stats).reduce((sum, count) => sum + count.inserted, 0);
    const totalSkipped = Object.values(stats).reduce((sum, count) => sum + count.skipped, 0);
    const totalFailed = Object.values(stats).reduce((sum, count) => sum + count.failed, 0);
    
    logger.info(`│ ✨ 總更新數量：${totalInserted.toString().padEnd(47)}│`);
    logger.info(`│ ⏭️  總跳過數量：${totalSkipped.toString().padEnd(46)}│`);
    logger.info(`│ ❌ 總失敗數量：${totalFailed.toString().padEnd(47)}│`);
    logger.info(`│ 🕒 執行時間：${duration} 秒${' '.repeat(47 - duration.toString().length)}│`);
    logger.info('└' + '─'.repeat(60) + '┘');

    if (totalFailed > 0) {
      logger.warn(`⚠️  注意：總共有 ${totalFailed} 筆內容處理失敗`);
    }

    logger.info('┌' + '─'.repeat(60) + '┐');
    logger.info(`│ ✅ 所有更新程序已完成${' '.repeat(43)}│`);
    logger.info('└' + '─'.repeat(60) + '┘');

  } catch (error) {
    logger.error('┌' + '─'.repeat(60) + '┐');
    logger.error(`│ ❌ 執行更新程序時發生錯誤${' '.repeat(39)}│`);
    logger.error('└' + '─'.repeat(60) + '┘');
    throw error;
  } finally {
    if (browser) {
      await browser.close();
      logger.info('==========================================');
      logger.info("🌐 瀏覽器已關閉");
      logger.info('==========================================');
    }
  }
}

// 修改主程序執行部分
// 移除原本的 if (require.main === module) 判斷
// 改用 import.meta.url 判斷是否為直接執行

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
