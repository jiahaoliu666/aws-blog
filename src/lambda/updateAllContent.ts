import dotenv from 'dotenv';
import {
  DynamoDBClient,
  PutItemCommand,
  ScanCommand,
  AttributeValue,
  GetItemCommand,
  QueryCommand,
  DeleteItemCommand
} from "@aws-sdk/client-dynamodb";
import { chromium, Browser, Page } from "playwright";
import { v4 as uuidv4 } from "uuid";
import OpenAI from "openai";
import { logger } from "../utils/logger.js";
import { lineService } from "../services/lineService.js";
import { discordService } from "../services/discordService.js";
import { sendEmailWithRetry, failedNotifications, processFailedNotifications } from "../utils/notificationUtils.js";
import { DISCORD_CONFIG, DISCORD_MESSAGE_TEMPLATES } from '../config/discord';
import { DiscordNotificationType } from '../types/discordTypes';
import { ArticleData, LineMessage, LineWebhookEvent, LineApiResponse, VerificationResponse } from '../types/lineTypes';

// 常量定義
const MAX_NOTIFICATIONS = 50;

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
  announcement: 10, // 更新公告數量
  news: 10, // 更新新聞數量
  solutions: 10, // 更新解決方案數量
  architecture: 10, // 更新架構數量
  knowledge: 10, // 更新知識中心數量
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
    notifications: {
      discord: number;
      email: number;
      line: number;
    };
    notificationsFailed: {
      discord: number;
      email: number;
      line: number;
    };
  }
};

// 修改 stats 的宣告
const stats: StatsType = {
  announcement: { 
    inserted: 0, 
    skipped: 0, 
    failed: 0, 
    notifications: { discord: 0, email: 0, line: 0 }, 
    notificationsFailed: { discord: 0, email: 0, line: 0 } 
  },
  news: { 
    inserted: 0, 
    skipped: 0, 
    failed: 0, 
    notifications: { discord: 0, email: 0, line: 0 }, 
    notificationsFailed: { discord: 0, email: 0, line: 0 } 
  },
  solutions: { 
    inserted: 0, 
    skipped: 0, 
    failed: 0, 
    notifications: { discord: 0, email: 0, line: 0 }, 
    notificationsFailed: { discord: 0, email: 0, line: 0 } 
  },
  architecture: { 
    inserted: 0, 
    skipped: 0, 
    failed: 0, 
    notifications: { discord: 0, email: 0, line: 0 }, 
    notificationsFailed: { discord: 0, email: 0, line: 0 } 
  },
  knowledge: { 
    inserted: 0, 
    skipped: 0, 
    failed: 0, 
    notifications: { discord: 0, email: 0, line: 0 }, 
    notificationsFailed: { discord: 0, email: 0, line: 0 } 
  }
};

// 在檔案開頭新增這些常量
const CONTENT_TYPES = {
  announcement: { name: '最新公告', emoji: '📢', color: '#FF9900' },
  news: { name: '最新新聞', emoji: '📰', color: '#527FFF' },
  solutions: { name: '解決方案', emoji: '💡', color: '#7AA116' },
  architecture: { name: '架構參考', emoji: '🏗️', color: '#EC7211' },
  knowledge: { name: '知識中心', emoji: '📚', color: '#D13212' }
};

// 新增一個型別來定義允許的內容類型
type ContentType = 'announcement' | 'news' | 'solutions' | 'architecture' | 'knowledge';

// 標題格式化函數
function formatTitle(title: string): string {
  return '【' + title + '】';
}

// 通用功能函數
async function checkIfExists(title: string, link: string, tableName: string): Promise<boolean | string> {
  const scanParams = {
    TableName: tableName,
    FilterExpression: "#title = :title OR #link = :link",
    ExpressionAttributeNames: {
      "#title": "title",
      "#link": "link"
    },
    ExpressionAttributeValues: {
      ":title": { S: title },
      ":link": { S: link }
    },
  };

  try {
    const data = await dbClient.send(new ScanCommand(scanParams));
    if (data.Items && data.Items.length > 0) {
      const existingItem = data.Items[0];
      // 記錄更詳細的重複資訊
      const duplicateReason = existingItem.title.S === title ? '標題重複' : 'URL重複';
      logger.info(`發現重複內容 (${duplicateReason}): ${title}`);
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
  // 提前檢查重複
  const exists = await checkIfExists(content.title, content.link, tableName);
  if (exists) {
    stats[type].skipped++;
    const { emoji } = CONTENT_TYPES[type as keyof typeof CONTENT_TYPES];
    logger.info(`   ${emoji} 內容已存在，跳過: ${content.title}`);
    return false;
  }

  // 只有在確認不重複後才執行這些耗時的操作
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
  page: Page,
  url: string,
  options: { waitUntil?: "load" | "domcontentloaded" | "networkidle" | "commit" } = { waitUntil: "networkidle" },
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
async function scrapeNews(browser: Browser): Promise<void> {
  const { name, emoji } = CONTENT_TYPES.news;
  
  const context = await browser.newContext({
    locale: 'en-US',
    geolocation: { latitude: 37.7749, longitude: -122.4194 }
  });
  const page = await context.newPage();
  
  try {
    await gotoWithRetry(page, "https://aws.amazon.com/blogs/?lang=en");

    let currentArticleCount = 0;
    
    while (currentArticleCount < FETCH_COUNTS.news) {
      // 等待文章卡片載入
      await page.waitForSelector('.m-card-title');
      
      // 計算當前頁面上的文章數量
      const articlesOnPage = await page.$$('.m-card-title');
      currentArticleCount = articlesOnPage.length;
      
      if (currentArticleCount < FETCH_COUNTS.news) {
        try {
          // 等待 "More" 按鈕出現
          await page.waitForSelector('.m-directories-more-arrow-icon');
          
          // 點擊 "More" 按鈕
          await page.click('.m-directories-more-arrow-icon');
          
          // 等待新內容載入
          await page.waitForTimeout(2000);
          
          // 等待網路請求完成
          await page.waitForLoadState('networkidle');
        } catch (error) {
          logger.warn(`無法載入更多文章: ${error}`);
          break;
        }
      } else {
        break;
      }
    }

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

    for (const article of articles) {
      await saveToDynamoDB(article, 'news', 'AWS_Blog_News');
    }
  } catch (error) {
    logger.error(`   ${emoji} 【${name}】爬取失敗`);
    logger.error(`   ${error}`);
  } finally {
    await context.close();
  }
}

async function scrapeAnnouncement(browser: Browser): Promise<void> {
  const { name, emoji } = CONTENT_TYPES.announcement;
  let totalArticlesScraped = 0;
  let currentPage = 1;
  
  const context = await browser.newContext({
    locale: 'en-US',
    geolocation: { latitude: 37.7749, longitude: -122.4194 }
  });
  const page = await context.newPage();
  
  try {
    // 設定基礎 URL，加入語言參數
    const baseUrl = "https://aws.amazon.com/new/?lang=en";
    const queryParams = "?whats-new-content-all.sort-by=item.additionalFields.postDateTime&whats-new-content-all.sort-order=desc&awsf.whats-new-categories=*all";

    while (totalArticlesScraped < FETCH_COUNTS.announcement) {
      const pageUrl = `${baseUrl}${queryParams}&awsm.page-whats-new-content-all=${currentPage}`;
      
      logger.info(`${emoji} 正在爬取第 ${currentPage} 頁的公告`);
      
      await page.goto(pageUrl, { waitUntil: 'networkidle', timeout: 60000 });

      // 等待文章卡片載入
      await page.waitForSelector('.m-card');

      // 檢查是否為最後一頁
      const isLastPage = await page.evaluate(() => {
        const nextButton = document.querySelector('.m-icon-angle-right');
        return !nextButton || nextButton.classList.contains('m-disabled');
      });

      // 爬取當前頁面的文章
      const announcements = await page.evaluate(() => {
        const cards = document.querySelectorAll('.m-card');
        const results = [];

        for (const card of cards) {
          const titleElement = card.querySelector('.m-card-title');
          const infoElement = card.querySelector('.m-card-info');
          const linkElement = card.querySelector('.m-card-title a');

          if (titleElement && linkElement) {
            const href = linkElement.getAttribute('href') || "";
            const fullUrl = href.startsWith('http') ? href : `https://aws.amazon.com${href}`;
            
            results.push({
              title: titleElement.textContent?.trim() || "沒有標題",
              info: infoElement?.textContent?.trim() || "沒有日期",
              link: fullUrl
            });
          }
        }

        return results;
      });

      // 處理當前頁面的文章
      for (const announcement of announcements) {
        if (totalArticlesScraped >= FETCH_COUNTS.announcement) {
          break;
        }

        // 轉換日期格式
        announcement.info = convertDateFormat(announcement.info);
        
        try {
          await saveToDynamoDB(announcement, 'announcement', 'AWS_Blog_Announcement');
          totalArticlesScraped++;
          
          // 更新進度
          logProgress('announcement', totalArticlesScraped, FETCH_COUNTS.announcement, '爬取進度');
        } catch (error) {
          logger.error(`儲存公告失敗: ${error}`);
        }
      }

      // 檢查是否需要繼續爬取
      if (isLastPage || totalArticlesScraped >= FETCH_COUNTS.announcement) {
        break;
      }

      // 切換到下一頁前等待一下
      await page.waitForTimeout(2000);
      currentPage++;
    }
  } catch (error) {
    logger.error(`   ${emoji} 【${name}】爬取失敗`);
    logger.error(`   ${error}`);
  } finally {
    await context.close();
  }
}

async function scrapeKnowledge(browser: Browser): Promise<void> {
  const context = await browser.newContext({
    locale: 'en-US',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();
  let articlesScraped = 0;
  let currentPage = 1;
  let hasNextPage = true;
  
  try {
    logger.info(`📚 開始爬取知識中心文章`);
    
    while (articlesScraped < FETCH_COUNTS.knowledge && hasNextPage) {
      logger.info(`正在爬取第 ${currentPage} 頁的文章`);
      
      try {
        // 檢查下一頁按鈕
        if (currentPage > 1) {
          const nextPageSelector = `.ant-pagination-item-${currentPage}`;
          const nextPageButton = await page.waitForSelector(nextPageSelector, { timeout: 5000 });
          
          if (!nextPageButton) {
            logger.info('沒有更多頁面可爬取');
            hasNextPage = false;
            break;
          }

          // 獲取下一頁的 href
          const nextPageHref = await page.$eval(nextPageSelector + ' a', el => el.getAttribute('href'));
          if (!nextPageHref) {
            logger.info('無法獲取下一頁連結');
            hasNextPage = false;
            break;
          }

          // 構建完整的 URL
          const nextPageUrl = `https://repost.aws${nextPageHref}`;
          
          // 訪問下一頁
          await gotoWithRetry(
            page,
            nextPageUrl,
            {
              waitUntil: 'networkidle'
            }
          );
          
          logger.info(`成功切換到第 ${currentPage} 頁，繼續爬取文章`);
        } else {
          // 第一頁的訪問
          await gotoWithRetry(
            page,
            'https://repost.aws/knowledge-center/all?view=all&sort=recent',
            {
              waitUntil: 'networkidle'
            }
          );
        }

        // 等待文章列表載入
        await page.waitForSelector('.KCArticleCard_card__HW_gu', { timeout: 30000 });
        
        // 獲取當前頁面的所有文章連結
        const articles = await page.evaluate(() => {
          const items = document.querySelectorAll('.KCArticleCard_card__HW_gu');
          return Array.from(items).map(item => {
            const linkElement = item.querySelector('.KCArticleCard_title__dhRk_ a');
            const descriptionElement = item.querySelector('.KCArticleCard_descriptionBody__hLZPL a');
            
            const link = linkElement?.getAttribute('href') || '沒有連結';
            const description = descriptionElement?.textContent?.trim() || '沒有描述';
            
            return { title: '', description, link, info: '' };
          });
        });

        // 處理當前頁面的每篇文章
        for (const article of articles) {
          if (articlesScraped >= FETCH_COUNTS.knowledge) {
            hasNextPage = false;
            break;
          }

          if (!article.link.startsWith('http')) {
            article.link = `https://repost.aws${article.link}`;
          }

          try {
            // 使用新的 context 來訪問文章詳細頁面
            const articleContext = await browser.newContext({
              locale: 'en-US',
              userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            });
            const articlePage = await articleContext.newPage();

            await gotoWithRetry(
              articlePage,
              article.link,
              {
                waitUntil: 'networkidle'
              }
            );
            
            // 等待標題載入
            await articlePage.waitForSelector('.KCArticleView_title___TWq1 h1', { timeout: 30000 });
            
            // 獲取文章標題和描述
            const articleData = await articlePage.evaluate(() => {
              const titleElement = document.querySelector('[data-test="kcArticle-title"] h1');
              const descriptionElement = document.querySelector('[data-test="kcArticle-description"] p');
              
              return {
                title: titleElement?.textContent?.trim() || '沒有標題',
                description: descriptionElement?.textContent?.trim() || '沒有描述',
                link: window.location.href,
                info: ''
              };
            });

            // 設置時間戳
            const timestamp = Math.floor(Date.now() / 1000);
            articleData.info = timestampToChineseDate(timestamp);

            // 儲存到資料庫
            await saveToDynamoDB(articleData, 'knowledge', 'AWS_Blog_Knowledge');
            articlesScraped++;
            
            logProgress('knowledge', articlesScraped, FETCH_COUNTS.knowledge, '爬取進度');

            // 關閉文章頁面的 context
            await articleContext.close();

          } catch (error) {
            logger.error(`處理知識文章失敗 (${article.link}):`, error);
            continue;
          }
        }

        // 準備進入下一頁
        if (articlesScraped < FETCH_COUNTS.knowledge) {
          currentPage++;
        } else {
          hasNextPage = false;
        }

      } catch (error) {
        logger.error(`處理第 ${currentPage} 頁時發生錯誤:`, error);
        hasNextPage = false;
        break;
      }
    }
  } catch (error) {
    logger.error("爬取知識中心時發生錯誤:", error);
  } finally {
    await context.close();
  }
}

async function scrapeSolutions(browser: Browser): Promise<void> {
  const page = await browser.newPage();
  const solutions = [];
  let currentPage = 1;
  
  try {
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Cache-Control': 'no-cache'
    });

    while (solutions.length < FETCH_COUNTS.solutions) {
      const pageUrl = currentPage === 1
        ? 'https://aws.amazon.com/solutions/?lang=en'
        : `https://aws.amazon.com/solutions/?lang=en&awsm.page-solutions-plus=${currentPage}`;

      logger.info(`正在爬取第 ${currentPage} 頁的解決方案`);

      await gotoWithRetry(page, pageUrl, {
        waitUntil: 'networkidle'
      });

      // 等待卡片載入
      await page.waitForSelector('.m-card');
      
      // 修改獲取卡片資訊的部分
      const cardsInfo = await page.evaluate(() => {
        const cards = document.querySelectorAll('.m-card');
        return Array.from(cards).map(card => {
          const titleElement = card.querySelector('.m-headline a');
          const descElement = card.querySelector('.m-desc');
          let description = '';
          
          if (descElement) {
            // 描述提取邏輯保持不變
            const textNodes = Array.from(descElement.childNodes)
              .filter(node => node.nodeType === Node.TEXT_NODE);
            
            if (textNodes.length > 0) {
              description = textNodes[0]?.textContent?.trim() || '';
            }
            
            if (!description) {
              const firstP = descElement.querySelector('p');
              if (firstP) {
                description = firstP.textContent?.trim() || '';
              }
            }

            if (!description) {
              description = descElement.textContent?.trim() || '';
            }
          }

          description = description.replace(/\s+/g, ' ').trim();

          return {
            title: '', // 先不取標題，等�問詳細頁面時再取
            description: description || '沒有描述',
            link: (titleElement as HTMLAnchorElement)?.href || ''
          };
        });
      });

      // 逐一處理每個卡片
      for (const cardInfo of cardsInfo) {
        if (solutions.length >= FETCH_COUNTS.solutions) break;
        
        try {
          // 訪問詳細頁面�取完整標題
          await gotoWithRetry(page, cardInfo.link, {
            waitUntil: 'networkidle'
          });

          // 等待並獲取完整標題
          await page.waitForSelector('.lb-breadcrumbs-dropTitle h1');
          const fullTitle = await page.$eval('.lb-breadcrumbs-dropTitle h1', 
            (element) => element.textContent?.trim() || '沒有標題'
          );

          const solutionWithTitle = {
            ...cardInfo,
            title: fullTitle
          };

          // 先檢查是否重複
          const exists = await checkIfExists(solutionWithTitle.title, solutionWithTitle.link, 'AWS_Blog_Solutions');
          if (exists) {
            stats.solutions.skipped++;
            logger.info(`   💡 內容已存在，跳過: ${solutionWithTitle.title}`);
            solutions.push({ ...solutionWithTitle, info: '' });
            logProgress('solutions', solutions.length, FETCH_COUNTS.solutions, '爬取進度');
            continue;
          }

          // 添加時間戳
          const timestamp = Math.floor(Date.now() / 1000);
          const solutionData = {
            ...solutionWithTitle,
            info: timestampToChineseDate(timestamp)
          };
          
          // 儲存到資料庫
          await saveToDynamoDB(solutionData, 'solutions', 'AWS_Blog_Solutions');
          solutions.push(solutionData);
          
          logProgress('solutions', solutions.length, FETCH_COUNTS.solutions, '爬取進度');

          // 返回列表頁
          await gotoWithRetry(page, pageUrl, {
            waitUntil: 'networkidle'
          });

          // 等待卡片重新載入
          await page.waitForSelector('.m-card');

        } catch (error) {
          logger.error(`爬取解決方案失敗 (${cardInfo.link}):`, error);
          continue;
        }
      }

      if (solutions.length < FETCH_COUNTS.solutions) {
        currentPage++;
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        break;
      }
    }

  } catch (error) {
    logger.error("爬取解決方案時發生錯誤:", error);
  } finally {
    await page.close();
  }
}

async function scrapeArchitecture(browser: Browser): Promise<void> {
  const page = await browser.newPage();
  const architectures = [];
  let currentPage = 1;
  
  try {
    // 設定瀏覽器語言為英文
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Cache-Control': 'no-cache'
    });

    while (architectures.length < FETCH_COUNTS.architecture) {
      // 修改 URL 結構，確保分頁參數正確
      const baseUrl = 'https://aws.amazon.com/architecture/';
      const queryParams = 'cards-all.sort-by=item.additionalFields.sortDate&cards-all.sort-order=desc&awsf.content-type=content-type%23reference-arch-diagram&awsf.methodology=*all&awsf.tech-category=*all&awsf.industries=*all&awsf.business-category=*all';

      logger.info(`正在爬取第 ${currentPage} 頁的架構參考`);

      // 構建完整的 URL，包含分頁參數
      const pageUrl = currentPage === 1
        ? `${baseUrl}?${queryParams}`
        : `${baseUrl}?${queryParams}&awsm.page-cards-all=${currentPage}`;

      try {
        await gotoWithRetry(page, pageUrl, {
          waitUntil: 'networkidle'
        });

        // 等待卡片載入
        await page.waitForSelector('.m-card-container', { timeout: 30000 });
        
        // 獲取當前頁面的所有卡片
        const cards = await page.$$('.m-card-container');
        
        // 如果沒有找到卡片，可能已經到達最後一頁
        if (!cards || cards.length === 0) {
          logger.info('沒有找到更多架構參考，停止爬取');
          break;
        }
        
        // 計算這一頁需要爬取的卡片數量
        const remainingCount = FETCH_COUNTS.architecture - architectures.length;
        const cardsToProcess = Math.min(cards.length, remainingCount);

        // 處理每個卡片
        for (let i = 0; i < cardsToProcess; i++) {
          const card = cards[i];
          
          try {
            // 等待卡片內容完全載入
            await card.hover();
            await page.waitForTimeout(500);

            const architecture = await card.evaluate((el) => {
              const titleElement = el.querySelector('.m-headline a');
              const descElement = el.querySelector('.m-desc');
              
              // 改進描述提取邏輯
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
                title: titleElement?.textContent?.trim() || '沒有標題',
                description: description || '沒有描述',
                link: (titleElement as HTMLAnchorElement)?.href || '沒有連結',
                info: ''
              };
            });

            // 設置時間戳
            const timestamp = Math.floor(Date.now() / 1000);
            architecture.info = timestampToChineseDate(timestamp);

            // 檢查是否為有效的架構資料
            if (architecture.title !== '沒有標題' && architecture.link !== '沒有連結') {
              architectures.push(architecture);
              logger.info(`成功提取架構：${architecture.title}`);
              
              // 更新進度
              logProgress('architecture', architectures.length, FETCH_COUNTS.architecture, '爬取進度');
              
              // 如果已達到目標數量，提前結束
              if (architectures.length >= FETCH_COUNTS.architecture) {
                logger.info('已達到目標數量，停止爬取');
                break;
              }
            }
          } catch (error) {
            logger.error(`處理卡片時發生錯誤:`, error);
            continue;
          }
        }

        // 檢查是否需要繼續爬取下一頁
        if (architectures.length >= FETCH_COUNTS.architecture) {
          break;
        }

        // 在切換到下一頁之前等待
        await page.waitForTimeout(2000);
        currentPage++;

      } catch (error) {
        logger.error(`爬取架構時發生錯誤:`, error);
        break;
      }
    }

    // 儲存爬取到的架構
    logger.info(`開始儲存 ${architectures.length} 個架構到資料庫`);
    for (const architecture of architectures) {
      try {
        await saveToDynamoDB(architecture, 'architecture', 'AWS_Blog_Architecture');
      } catch (error) {
        logger.error(`儲存架構失敗: ${architecture.title}`, error);
      }
    }

  } catch (error) {
    logger.error("爬取架構時發生錯誤:", error);
  } finally {
    await page.close();
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
            stats[type].notifications.discord++;
            logger.info(`成功發送 Discord 通知給用戶 ${user.userId.S}`);
          } else {
            stats[type].notificationsFailed.discord++;
            logger.error(`發送 Discord 通知失敗 (用戶 ID: ${user.userId.S})`);
          }
        } catch (error) {
          stats[type].notificationsFailed.discord++;
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
    FilterExpression: "lineNotification = :true AND attribute_exists(lineId)",
    ExpressionAttributeValues: {
      ":true": { BOOL: true },
    },
  };

  try {
    const command = new ScanCommand(params);
    const response = await dbClient.send(command);
    return (response.Items || []).map(item => ({
      userId: { S: item.userId.S || '' },
      lineId: { S: item.lineId.S || '' },
      lineNotification: { BOOL: true }
    }));
  } catch (error) {
    logger.error("獲取 Line 通知用戶時發生錯誤:", error);
    return [];
  }
}

async function getAllUserIds(): Promise<string[]> {
  const params = {
    TableName: "AWS_Blog_UserProfiles",
    FilterExpression: "attribute_exists(userId)",
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
      userId: { S: userId },
      article_id: { S: contentId },
      read: { BOOL: false },
      created_at: { N: String(Math.floor(Date.now() / 1000)) },
      category: { S: category === 'solutions' ? 'solution' : category }
    }
  };

  try {
    await dbClient.send(new PutItemCommand(params));
    logger.info(`成功新增通知：
   👤 用戶ID：${userId}
   📄 文章ID：${contentId}
   📑 分類：${category}`);
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
    
    // 為每個用戶新增通知記錄並清理舊通知
    for (const userId of allUserIds) {
      try {
        // 1. 查詢用戶當前的通知數量
        const queryParams = {
          TableName: "AWS_Blog_UserNotifications",
          KeyConditionExpression: "userId = :userId",
          ExpressionAttributeValues: {
            ":userId": { S: userId }
          },
          ProjectionExpression: "userId, article_id, created_at",
          ScanIndexForward: false  // 降序排序，最新的在前面
        };

        const result = await dbClient.send(new QueryCommand(queryParams));
        const notifications = result.Items || [];

        // 2. 如果通知數量已經達到或超過50，刪除最舊的通知
        if (notifications.length >= MAX_NOTIFICATIONS) {
          const notificationsToDelete = notifications.slice(MAX_NOTIFICATIONS - 1);
          
          for (const notification of notificationsToDelete) {
            const deleteParams = {
              TableName: "AWS_Blog_UserNotifications",
              Key: {
                userId: { S: userId },
                article_id: notification.article_id
              }
            };

            await dbClient.send(new DeleteItemCommand(deleteParams));
            logger.info(`已刪除舊通知: userId=${userId}, article_id=${notification.article_id.S}`);
          }
        }

        // 3. 新增新的通知
        await addNotification(userId, contentId, type);
        logger.info(`成功新增通知記錄：用戶 ${userId}, \n內容 ${contentId}`);
      } catch (error) {
        logger.error(`新增通知記錄失敗 (用戶 ID: ${userId}):`, error);
      }
    }

    // 獲取啟用 LINE 通知的用戶
    const lineUsers = await getLineNotificationUsers();
    logger.info(`找到 ${lineUsers.length} 個有效的 LINE 通知用戶`);

    // 檢查 LINE 環境變數
    if (!process.env.LINE_CHANNEL_ACCESS_TOKEN || !process.env.LINE_CHANNEL_SECRET) {
      logger.warn('缺少 LINE API 設定，跳過 LINE 通知發送');
      stats[type].skipped++;
    } else {
      // 發送 LINE 通知
      for (const user of lineUsers) {
        if (!user.lineId?.S) {
          logger.warn(`用戶 ${user.userId.S} 缺少 LINE ID，跳過通知`);
          continue;
        }

        try {
          const message: LineMessage = {
            type: 'flex',
            altText: `AWS ${CONTENT_TYPES[type].name}: ${title}`,
            contents: {
              type: 'bubble',
              size: 'giga',
              header: {
                type: 'box',
                layout: 'vertical',
                contents: [
                  {
                    type: 'box',
                    layout: 'horizontal',
                    contents: [
                      {
                        type: 'text',
                        text: CONTENT_TYPES[type].emoji,
                        size: 'xxl',
                        flex: 1
                      },
                      {
                        type: 'text',
                        text: `AWS ${CONTENT_TYPES[type].name}`,
                        weight: 'bold',
                        size: 'xl',
                        color: '#ffffff',
                        flex: 5
                      }
                    ],
                    alignItems: 'center',
                    spacing: 'md'
                  }
                ],
                backgroundColor: '#232F3E',
                paddingAll: '20px',
                paddingTop: '22px',
                paddingBottom: '22px'
              },
              body: {
                type: 'box',
                layout: 'vertical',
                contents: [
                  {
                    type: 'text',
                    text: title,
                    weight: 'bold',
                    size: 'lg',
                    wrap: true,
                    color: '#232F3E'
                  },
                  {
                    type: 'separator',
                    margin: 'xl',
                    color: '#FF9900'
                  },
                  {
                    type: 'text',
                    text: summary,
                    size: 'md',
                    color: '#666666',
                    margin: 'lg',
                    wrap: true
                  }
                ],
                paddingAll: '20px',
                backgroundColor: '#FFFFFF'
              },
              footer: {
                type: 'box',
                layout: 'vertical',
                contents: [
                  {
                    type: 'button',
                    action: {
                      type: 'uri',
                      label: '閱讀全文 →',
                      uri: link
                    },
                    style: 'primary',
                    color: '#FF9900',
                    height: 'sm'
                  },
                  {
                    type: 'box',
                    layout: 'vertical',
                    contents: [
                      {
                        type: 'text',
                        text: 'AWS Blog 365',
                        size: 'xs',
                        color: '#aaaaaa',
                        align: 'center'
                      }
                    ],
                    margin: 'sm'
                  }
                ],
                paddingAll: '20px',
                backgroundColor: '#f5f5f5'
              },
              styles: {
                header: {
                  separator: false
                },
                footer: {
                  separator: true
                }
              }
            }
          };

          await lineService.sendMessage(user.lineId.S, message);
          stats[type].notifications.line++;
          logger.info(`成功發送 LINE 通知給用戶 ${user.userId.S}`);
        } catch (error) {
          stats[type].notificationsFailed.line++;
          logger.error(`發送 LINE 通知失敗 (用戶 ID: ${user.userId.S}):`, error);
          
          failedNotifications.push({
            userId: user.userId.S,
            articleId: contentId,
            type: 'line',
            error: error instanceof Error ? error.message : '未知錯誤'
          });
        }
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
          <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
          <html xmlns="http://www.w3.org/1999/xhtml">
            <head>
              <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
              <title>AWS Blog 365 通知</title>
            </head>
            <body style="margin: 0; padding: 0;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-family: Arial, sans-serif;">
                <!-- 外層容器 -->
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                      
                      <!-- 標題區域 -->
                      <tr>
                        <td align="center" style="padding: 30px 40px 20px 40px; background-color: #232F3E; border-radius: 8px 8px 0 0;">
                          <table border="0" cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                              <td style="color: #FFFFFF; font-size: 24px; font-weight: bold; text-align: center;">
                                ${title}
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>

                      <!-- 內容區域 -->
                      <tr>
                        <td style="padding: 30px 40px;">
                          <table border="0" cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                              <td style="padding: 20px; background-color: #f8f9fa; border-radius: 8px; color: #444444; font-size: 16px; line-height: 24px;">
                                ${summary}
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>

                      <!-- 按鈕區域 -->
                      <tr>
                        <td align="center" style="padding: 0 40px 30px 40px;">
                          <table border="0" cellpadding="0" cellspacing="0">
                            <tr>
                              <td align="center" bgcolor="#FF9900" style="border-radius: 4px;">
                                <a href="${link}" 
                                   target="_blank"
                                   style="display: inline-block; padding: 12px 30px; font-size: 16px; color: #232F3E; text-decoration: none; font-weight: bold;">
                                  閱讀全文 →
                                </a>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>

                      <!-- 頁尾區域 -->
                      <tr>
                        <td style="padding: 20px 40px 30px 40px; background-color: #f8f9fa; border-radius: 0 0 8px 8px;">
                          <table border="0" cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                              <td align="center" style="color: #666666; font-size: 14px; line-height: 20px;">
                                <p style="margin: 0;">此為系統自動發送的通知郵件，請勿直接回覆</p>
                                <p style="margin: 10px 0 0 0;">© ${new Date().getFullYear()} AWS Blog 365. All rights reserved.</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>

                    </table>
                  </td>
                </tr>
              </table>
            </body>
          </html>
        `;

        await sendEmailWithRetry({
          to: user.email.S,
          subject: `【AWS Blog 365】${CONTENT_TYPES[type].name} - ${title.substring(0, 50)}${title.length > 50 ? '...' : ''}`,
          html: emailContent
        });

        stats[type].notifications.email++;
        logger.info(`成功發送電子郵件通知給用戶 ${user.userId.S}`);
      } catch (error) {
        stats[type].notificationsFailed.email++;
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
          stats[type].notifications.discord++;
          logger.info(`成功發送 Discord 通知給用戶 ${user.userId.S}`);
        } else {
          stats[type].notificationsFailed.discord++;
          logger.error(`發送 Discord 通知失敗 (用戶 ID: ${user.userId.S})`);
          
          failedNotifications.push({
            userId: user.userId.S,
            articleId: contentId,
            type: 'discord',
            error: 'Discord 通知發送失敗'
          });
        }
      } catch (error) {
        stats[type].notificationsFailed.discord++;
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
function logUpdateResult(type: string, result: StatsType[keyof StatsType]) {
  const { name, emoji } = CONTENT_TYPES[type as keyof typeof CONTENT_TYPES];
  const total = result.inserted + result.skipped + result.failed;
  const totalNotifications = 
    result.notifications.discord + 
    result.notifications.email + 
    result.notifications.line;
  const totalNotificationsFailed = 
    result.notificationsFailed.discord + 
    result.notificationsFailed.email + 
    result.notificationsFailed.line;
  
  const boxWidth = 62;
  const line = '─'.repeat(boxWidth - 2);
  
  logger.info(`┌${line}┐`);
  logger.info(`│ ${emoji} ${formatTitle(name)}${' '.repeat(boxWidth - name.length - emoji.length - 5)}`);
  logger.info(`├${line}┤`);
  logger.info(`│ ✨ 新增內容：${result.inserted}${' '.repeat(boxWidth - 13 - result.inserted.toString().length)}`);
  logger.info(`│ ⏭️  跳過內容：${result.skipped}${' '.repeat(boxWidth - 13 - result.skipped.toString().length)}`);
  logger.info(`│ ❌ 失敗內容：${result.failed}${' '.repeat(boxWidth - 13 - result.failed.toString().length)}`);
  logger.info(`│ 📱 Line 通知：${result.notifications.line}${' '.repeat(boxWidth - 13 - result.notifications.line.toString().length)}`);
  logger.info(`│ 📧 Email 通知：${result.notifications.email}${' '.repeat(boxWidth - 14 - result.notifications.email.toString().length)}`);
  logger.info(`│ 🎮 Discord 通知：${result.notifications.discord}${' '.repeat(boxWidth - 15 - result.notifications.discord.toString().length)}`);
  logger.info(`│ 📊 通知失敗：${totalNotificationsFailed}${' '.repeat(boxWidth - 13 - totalNotificationsFailed.toString().length)}`);
  logger.info(`│ 📊 處理總數：${total}${' '.repeat(boxWidth - 13 - total.toString().length)}`);
  logger.info(`└${line}┘`);

  if (result.failed > 0 || totalNotificationsFailed > 0) {
    const warningMsg = `⚠️  注意：${formatTitle(name)}有 ${result.failed} 筆內容處理失敗，${totalNotificationsFailed} 筆通知發送失敗`;
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
async function scrapeContent(browser: Browser, type: ContentType, articles: ContentData[]) {
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
  let browser: Browser | null = null;
  const startTime = Date.now();
  const boxWidth = 62;
  const line = '─'.repeat(boxWidth - 2);

  try {
    logger.info(`┌${line}┐`);
    logger.info(`│ 🚀 AWS 爬取文章程序開始${' '.repeat(boxWidth - 20)}`);
    logger.info(`│ 📅 執行時間：${new Date().toLocaleString()}${' '.repeat(boxWidth - new Date().toLocaleString().length - 8)}`);
    logger.info(`└${line}┘`);
    
    browser = await chromium.launch({
      headless: true
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
    const totalLineNotifications = Object.values(stats).reduce((sum, count) => sum + count.notifications.line, 0);
    const totalEmailNotifications = Object.values(stats).reduce((sum, count) => sum + count.notifications.email, 0);
    const totalDiscordNotifications = Object.values(stats).reduce((sum, count) => sum + count.notifications.discord, 0);
    const totalLineNotificationsFailed = Object.values(stats).reduce((sum, count) => sum + count.notificationsFailed.line, 0);
    const totalEmailNotificationsFailed = Object.values(stats).reduce((sum, count) => sum + count.notificationsFailed.email, 0);
    const totalDiscordNotificationsFailed = Object.values(stats).reduce((sum, count) => sum + count.notificationsFailed.discord, 0);
    
    logger.info(`│ ✨ 總更新數量：${totalInserted}${' '.repeat(boxWidth - 13 - totalInserted.toString().length)}`);
    logger.info(`│ ⏭️  總跳過數量：${totalSkipped}${' '.repeat(boxWidth - 13 - totalSkipped.toString().length)}`);
    logger.info(`│ ❌ 總失敗數量：${totalFailed}${' '.repeat(boxWidth - 13 - totalFailed.toString().length)}`);
    logger.info(`│ 📱 Line 通知總數：${totalLineNotifications}${' '.repeat(boxWidth - 16 - totalLineNotifications.toString().length)}`);
    logger.info(`│ 📧 Email 通知總數：${totalEmailNotifications}${' '.repeat(boxWidth - 17 - totalEmailNotifications.toString().length)}`);
    logger.info(`│ 🎮 Discord 通知總數：${totalDiscordNotifications}${' '.repeat(boxWidth - 18 - totalDiscordNotifications.toString().length)}`);
    logger.info(`│ 📱 Line 通知失敗：${totalLineNotificationsFailed}${' '.repeat(boxWidth - 16 - totalLineNotificationsFailed.toString().length)}`);
    logger.info(`│ 📧 Email 通知失敗：${totalEmailNotificationsFailed}${' '.repeat(boxWidth - 17 - totalEmailNotificationsFailed.toString().length)}`);
    logger.info(`│ 🎮 Discord 通知失敗：${totalDiscordNotificationsFailed}${' '.repeat(boxWidth - 18 - totalDiscordNotificationsFailed.toString().length)}`);
    logger.info(`│ 🕒 執行時間：${duration} 秒${' '.repeat(boxWidth - 14 - duration.toString().length)}`);
    logger.info(`└${line}┘`);

    if (totalFailed > 0 || totalLineNotificationsFailed > 0 || totalEmailNotificationsFailed > 0 || totalDiscordNotificationsFailed > 0) {
      const warningMsg = `⚠️  注意：總共有 ${totalFailed} 筆內容處理失敗，${totalLineNotificationsFailed} 筆 Line 通知發送失敗，${totalEmailNotificationsFailed} 筆 Email 通知發送失敗，${totalDiscordNotificationsFailed} 筆 Discord 通知發送失敗`;
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