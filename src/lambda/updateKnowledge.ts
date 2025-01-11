// import dotenv from 'dotenv';
// import {
//   DynamoDBClient,
//   PutItemCommand,
//   ScanCommand,
//   AttributeValue
// } from "@aws-sdk/client-dynamodb";
// import * as puppeteer from "puppeteer";
// import { v4 as uuidv4 } from "uuid";
// import OpenAI from "openai";
// import { logger } from "../utils/logger.js";
// import { lineService } from "../services/lineService.js";
// import { sendEmailWithRetry, failedNotifications, processFailedNotifications } from "../utils/notificationUtils.js";

// // 介面定義
// interface Knowledge {
//   title: string;
//   description: string;
//   link: string;
// }

// interface KnowledgeData {
//   title: string;
//   link: string;
//   timestamp: string;
//   summary: string;
// }

// interface NotificationUser {
//   userId: { S: string };
//   email: { S: string };
// }

// // 環境變數配置
// dotenv.config({ path: ".env.local" });

// // 常量定義
// const NUMBER_OF_KNOWLEDGE_TO_FETCH = 4;

// // 初始化客戶端
// const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
// const dbClient = new DynamoDBClient({
//   region: "ap-northeast-1",
// });

// let insertedCount = 0;
// let skippedCount = 0;

// // 主要功能函數
// async function checkIfExists(title: string): Promise<boolean | string> {
//   const scanParams = {
//     TableName: process.env.DYNAMODB_KNOWLEDGE_TABLE || 'AWS_Blog_Knowledge',
//     FilterExpression: "#title = :title",
//     ExpressionAttributeNames: {
//       "#title": "title",
//     },
//     ExpressionAttributeValues: {
//       ":title": { S: title },
//     },
//   };

//   try {
//     const data = await dbClient.send(new ScanCommand(scanParams));
//     if (data.Items && data.Items.length > 0) {
//       const existingItem = data.Items[0];
//       return existingItem.summary?.S || false;
//     }
//     return false;
//   } catch (error) {
//     logger.error("檢查知識文章存在時發生錯誤:", error);
//     return false;
//   }
// }

// async function summarizeKnowledge(url: string): Promise<string> {
//   const maxTokens = 200;
//   const prompt = `請用繁體中文簡潔扼要地總結這篇 AWS Knowledge Center 文章的主要內容（限 100 字以內）：${url}
// 要求：
// 1. 直接說明此知識文章的主要問題和解決方案
// 2. 只提及關鍵步驟或重要概念
// 3. 避免贅詞`;

//   if (prompt.length > 2000) {
//     console.warn('請求內容過長，請檢查 URL 或上下文。');
//     return '請求內容過長，無法處理。';
//   }

//   console.log(`正在請求總結知識文章: ${url}`);
//   try {
//     const response = await openai.chat.completions.create({
//       model: "gpt-3.5-turbo",
//       messages: [{ role: "user", content: prompt }],
//       max_tokens: maxTokens,
//     });
//     console.log(`已獲取知識文章總結`);
//     return response.choices[0]?.message?.content?.trim() || "無法獲取總結";
//   } catch (error) {
//     console.error("總結知識文章時發生錯誤:", error);
//     return "無法獲取總結";
//   }
// }

// async function translateText(text: string): Promise<string> {
//   console.log(`開始翻譯文本`);
  
//   try {
//     const response = await openai.chat.completions.create({
//       model: 'gpt-4-turbo-preview',
//       messages: [
//         {
//           role: 'system',
//           content: '你是一位專業的翻譯專家。請將英文翻譯成標準繁體中文，注意事項：\n1. 必須使用繁體中文，不可出現簡體字\n2. 保持 AWS 相關專業術語的準確性和一致性\n3. 遵循台灣地區的用語習慣\n4. 確保翻譯結果通順且專業\n5. 保留原文中的專有名詞，如 AWS 服務名稱'
//         },
//         {
//           role: 'user',
//           content: `請將以下文本翻譯成繁體中文：\n${text}`
//         }
//       ],
//       temperature: 0.2,
//     });

//     const translatedText = response.choices[0]?.message?.content?.trim() || text;
//     console.log(`翻譯成功`);
//     return translatedText;
//   } catch (error) {
//     console.error('翻譯時發生錯誤:', error);
//     return text;
//   }
// }

// async function saveToDynamoDB(knowledge: Knowledge): Promise<boolean> {
//   console.log(`開始處理知識文章: ${knowledge.title}`);
//   const exists = await checkIfExists(knowledge.title);
//   if (exists) {
//     skippedCount++;
//     console.log(`知識文章已存在，跳過`);
//     return false;
//   }

//   const summary = await summarizeKnowledge(knowledge.link);
//   const translatedTitle = await translateText(knowledge.title);
//   const translatedDescription = await translateText(knowledge.description);

//   const knowledgeId = uuidv4();
//   const params = {
//     TableName: process.env.DYNAMODB_KNOWLEDGE_TABLE || 'AWS_Blog_Knowledge',
//     Item: {
//       article_id: { S: knowledgeId },
//       title: { S: knowledge.title },
//       translated_title: { S: translatedTitle },
//       description: { S: knowledge.description },
//       translated_description: { S: translatedDescription },
//       link: { S: knowledge.link },
//       summary: { S: summary },
//       created_at: { N: String(Math.floor(Date.now() / 1000)) },
//     },
//   };

//   try {
//     console.log(`插入知識文章到資料庫`);
//     await dbClient.send(new PutItemCommand(params));
//     insertedCount++;

//     const knowledgeData: KnowledgeData = {
//       title: translatedTitle,
//       link: knowledge.link,
//       timestamp: Date.now().toString(),
//       summary: summary
//     };

//     // 發送 LINE 通知
//     await sendLineNotifications(knowledgeData);
    
//     // 新增用戶通知
//     await broadcastNewKnowledge(knowledgeId);

//     return true;
//   } catch (error) {
//     logger.error('儲存知識文章時發生錯誤:', error);
//     return false;
//   }
// }

// async function gotoWithRetry(
//   page: puppeteer.Page,
//   url: string,
//   options: puppeteer.WaitForOptions & { timeout?: number },
//   retries = 3
// ): Promise<void> {
//   for (let i = 0; i < retries; i++) {
//     try {
//       await page.goto(url, options);
//       return;
//     } catch (error) {
//       if (i === retries - 1) throw error;
//       console.warn(`加載失敗，重試 ${i + 1}/${retries} 次...`);
//       await new Promise((resolve) => setTimeout(resolve, 2000));
//     }
//   }
// }

// async function scrapeAWSKnowledge(): Promise<void> {
//   let browser: puppeteer.Browser | null = null;
//   try {
//     // 計算需要爬取的文章數量
//     const currentCount = await countKnowledgeInDatabase();
//     const remainingArticles = NUMBER_OF_KNOWLEDGE_TO_FETCH - currentCount;

//     if (remainingArticles <= 0) {
//       console.log(`資料庫中已有足夠知識文章 (${currentCount}/${NUMBER_OF_KNOWLEDGE_TO_FETCH})，無需更新`);
//       return;
//     }

//     console.log(`需要爬取 ${remainingArticles} 篇新文章`);

//     browser = await puppeteer.launch({ 
//       headless: true,
//       args: ['--incognito', '--no-sandbox', '--disable-setuid-sandbox'],
//       defaultViewport: { width: 1920, height: 1080 }
//     });
//     const page = await browser.newPage();
    
//     page.setDefaultTimeout(30000);
//     page.setDefaultNavigationTimeout(30000);

//     await page.setExtraHTTPHeaders({
//       'Accept-Language': 'en-US,en;q=0.9',
//       'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36'
//     });

//     console.log('開始訪問網頁...');
//     await gotoWithRetry(
//       page,
//       'https://repost.aws/knowledge-center/all?view=all&sort=recent',
//       {
//         waitUntil: 'networkidle0',
//         timeout: 60000,
//       }
//     );

//     console.log('等待頁面載入...');
//     await page.waitForSelector('.KCArticleCard_card__HW_gu', { timeout: 30000 });
//     console.log('頁面已載入');

//     let processedArticles = 0;

//     // 只獲取需要的文章數量
//     const articles = await page.evaluate(() => {
//       const items = document.querySelectorAll('.KCArticleCard_card__HW_gu');
//       return Array.from(items).slice(0, 5).map(item => {
//         const titleElement = item.querySelector('.KCArticleCard_title__dhRk_ a');
//         const descriptionElement = item.querySelector('.KCArticleCard_descriptionBody__hLZPL a');
        
//         const link = titleElement?.getAttribute('href') || '沒有連結';
//         const description = descriptionElement?.textContent?.trim() || '沒有描述';
        
//         return { title: '', description, link };
//       });
//     });

//     // 處理文章
//     for (const article of articles) {
//       if (processedArticles >= remainingArticles) break;

//       if (!article.link.startsWith('http')) {
//         article.link = `https://repost.aws${article.link}`;
//       }

//       try {
//         await gotoWithRetry(
//           page,
//           article.link,
//           {
//             waitUntil: 'networkidle0',
//             timeout: 30000,
//           }
//         );
        
//         // 等待標題元素載入
//         await page.waitForSelector('.KCArticleView_title___TWq1 h1');
        
//         // 獲取完整標題
//         article.title = await page.$eval('.KCArticleView_title___TWq1 h1', 
//           (element) => element.textContent?.trim() || '沒有標題'
//         );
        
//         console.log('獲取到完整標題:', article.title);
//       } catch (error) {
//         logger.error(`爬取文章標題時發生錯誤 (${article.link}):`, error);
//         article.title = '無法獲取標題';
//         continue;
//       }

//       console.log('處理文章:', article);
//       if (await saveToDynamoDB(article)) {
//         processedArticles++;
//         console.log(`成功處理第 ${processedArticles}/${remainingArticles} 篇文章`);
//       }
//     }

//     console.log(`\n📊 更新執行報告`);
//     console.log(`==================`);
//     console.log(`✅ 新增知識文章數量: ${insertedCount}`);
//     console.log(`⏭️ 已存在知識文章數: ${skippedCount}`);
//     console.log(`🔄 總處理知識文章數: ${insertedCount + skippedCount}`);
//     console.log(`==================\n`);

//   } catch (error) {
//     logger.error("執行更新時發生錯誤:", error);
//     throw error;
//   } finally {
//     if (browser) {
//       await browser.close();
//     }
//   }
// }

// // 通知相關函數
// async function sendLineNotifications(knowledgeData: KnowledgeData): Promise<void> {
//   try {
//     const lineUsers = await getLineNotificationUsers();
//     if (lineUsers.length > 0 && process.env.LINE_CHANNEL_ACCESS_TOKEN) {
//       await lineService.sendKnowledgeNotification(knowledgeData);
//       logger.info(`成功發送 LINE 通知給 ${lineUsers.length} 位用戶`);
//     }
//   } catch (error) {
//     logger.warn("LINE 通知發送失敗:", error);
//   }
// }

// async function getLineNotificationUsers(): Promise<NotificationUser[]> {
//   const params = {
//     TableName: "AWS_Blog_UserNotificationSettings",
//     FilterExpression: "lineNotification = :true",
//     ExpressionAttributeValues: {
//       ":true": { BOOL: true },
//     },
//   };

//   try {
//     const command = new ScanCommand(params);
//     const response = await dbClient.send(command);
//     return (response.Items || []).map(item => ({
//       userId: { S: item.userId.S || '' },
//       email: { S: item.email.S || '' }
//     }));
//   } catch (error) {
//     logger.error("獲取 Line 通知用戶時發生錯誤:", error);
//     return [];
//   }
// }

// async function getAllUserIds(): Promise<string[]> {
//   const params = {
//     TableName: "AWS_Blog_UserProfiles",
//     ProjectionExpression: "userId",
//   };

//   try {
//     const command = new ScanCommand(params);
//     const response = await dbClient.send(command);
//     return response.Items?.map((item) => item.userId.S as string) || [];
//   } catch (error) {
//     logger.error("獲取用戶 ID 時發生錯誤:", error);
//     return [];
//   }
// }

// async function addNotification(userId: string, knowledgeId: string): Promise<void> {
//   const params = {
//     TableName: "AWS_Blog_UserNotifications",
//     Item: {
//       userId: { S: userId },
//       article_id: { S: knowledgeId },
//       read: { BOOL: false },
//       created_at: { N: String(Math.floor(Date.now() / 1000)) },
//       category: { S: "knowledge" }
//     }
//   };

//   try {
//     await dbClient.send(new PutItemCommand(params));
//     logger.info(`成功新增通知: userId=${userId}, knowledge_id=${knowledgeId}`);
//   } catch (error) {
//     logger.error("新增通知失敗:", error);
//     throw error;
//   }
// }

// async function broadcastNewKnowledge(knowledgeId: string): Promise<void> {
//   try {
//     const users = await getAllUserIds();
//     for (const userId of users) {
//       await addNotification(userId, knowledgeId);
//     }
//   } catch (error) {
//     logger.error("廣播新知識文章通知時發生錯誤:", error);
//   }
// }

// async function countKnowledgeInDatabase(): Promise<number> {
//   const scanParams = {
//     TableName: process.env.DYNAMODB_KNOWLEDGE_TABLE || 'AWS_Blog_Knowledge',
//   };

//   try {
//     const data = await dbClient.send(new ScanCommand(scanParams));
//     return data.Items ? data.Items.length : 0;
//   } catch (error) {
//     logger.error('計數資料庫知識文章時發生錯誤:', error);
//     return 0;
//   }
// }

// // 主程序執行
// (async () => {
//   try {
//     await scrapeAWSKnowledge();
//   } catch (error) {
//     logger.error("執行更新程序時發生錯誤:", error);
//     process.exit(1);
//   }
// })();