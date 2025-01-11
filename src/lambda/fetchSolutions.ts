// import dotenv from 'dotenv';
// import {
//   DynamoDBClient,
//   PutItemCommand,
//   ScanCommand,
// } from '@aws-sdk/client-dynamodb';
// import * as puppeteer from 'puppeteer';
// import { v4 as uuidv4 } from 'uuid';
// import readline from 'readline';
// import OpenAI from 'openai';

// dotenv.config({ path: '.env.local' });

// interface Solution {
//   title: string;
//   description: string;
//   link: string;
// }

// const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// const dbClient = new DynamoDBClient({
//   region: 'ap-northeast-1',
// });

// let insertedCount = 0;
// let skippedCount = 0;

// const rl = readline.createInterface({
//   input: process.stdin,
//   output: process.stdout,
// });

// async function checkIfExists(title: string): Promise<boolean | string> {
//   const scanParams = {
//     TableName: process.env.DYNAMODB_SOLUTIONS_TABLE || 'AWS_Blog_Solutions',
//     FilterExpression: '#title = :title',
//     ExpressionAttributeNames: {
//       '#title': 'title',
//     },
//     ExpressionAttributeValues: {
//       ':title': { S: title },
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
//     console.error('檢查解決方案存在時發生錯誤:', error);
//     return false;
//   }
// }

// async function countSolutionsInDatabase(): Promise<number> {
//   const scanParams = {
//     TableName: process.env.DYNAMODB_SOLUTIONS_TABLE || 'AWS_Blog_Solutions',
//   };

//   try {
//     const data = await dbClient.send(new ScanCommand(scanParams));
//     return data.Items ? data.Items.length : 0;
//   } catch (error) {
//     console.error('計數資料庫解決方案時發生錯誤:', error);
//     return 0;
//   }
// }

// async function summarizeSolution(url: string): Promise<string> {
//   const maxTokens = 200;
//   const prompt = `請用繁體中文簡潔扼要地總結這個 AWS Solution 的主要內容（限 100 字以內）：${url}
// 要求：
// 1. 直接說明此解決方案的主要功能
// 2. 只提及關鍵技術點或架構特色
// 3. 避免贅詞`;

//   if (prompt.length > 2000) {
//     console.warn('請求內容過長，請檢查 URL 或上下文。');
//     return '請求內容過長，無法處理。';
//   }

//   console.log(`正在請求總結解決方案: ${url}`);
//   try {
//     const response = await openai.chat.completions.create({
//       model: 'gpt-3.5-turbo',
//       messages: [{ role: 'user', content: prompt }],
//       max_tokens: maxTokens,
//     });
//     console.log(`已獲取解決方案總結: ${url}`);
//     return response.choices[0]?.message?.content?.trim() || '無法獲取總結';
//   } catch (error) {
//     console.error('總結解決方案時發生錯誤:', error);
//     return '無法獲取總結';
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

// async function saveToDynamoDB(solution: Solution): Promise<boolean> {
//   console.log(`開始處理解決方案: ${solution.title}`);
//   const exists = await checkIfExists(solution.title);
//   if (exists) {
//     skippedCount++;
//     console.log(`解決方案已存在，跳過`);
//     return false;
//   }

//   const summary = await summarizeSolution(solution.link);
//   const translatedTitle = await translateText(solution.title);
//   const translatedDescription = await translateText(solution.description);

//   const params = {
//     TableName: process.env.DYNAMODB_SOLUTIONS_TABLE || 'AWS_Blog_Solutions',
//     Item: {
//       article_id: { S: uuidv4() },
//       title: { S: solution.title },
//       translated_title: { S: translatedTitle },
//       description: { S: solution.description },
//       translated_description: { S: translatedDescription },
//       link: { S: solution.link },
//       summary: { S: summary },
//       created_at: { N: String(Math.floor(Date.now() / 1000)) },
//     },
//   };

//   try {
//     console.log(`插入解決方案到資料庫`);
//     await dbClient.send(new PutItemCommand(params));
//     insertedCount++;
//     console.log(`解決方案插入成功`);
//     return true;
//   } catch (error) {
//     console.error('插入解決方案時發生錯誤:', error);
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

// async function scrapeAWSSolutions(targetNumberOfSolutions: number): Promise<void> {
//   let browser: puppeteer.Browser | null = null;
//   try {
//     const initialTotalSolutions = await countSolutionsInDatabase();
//     console.log(`資料庫初始解決方案數量: ${initialTotalSolutions}`);

//     let totalSolutionsInDatabase = initialTotalSolutions;
//     if (totalSolutionsInDatabase >= targetNumberOfSolutions) {
//       console.log(`資料庫中已有足夠解決方案，無需再抓取`);
//       return;
//     }

//     browser = await puppeteer.launch({ 
//       headless: true,
//       args: ['--incognito'] 
//     });
//     const page = await browser.newPage();
    
//     await page.setExtraHTTPHeaders({
//       'Accept-Language': 'en-US,en;q=0.9'
//     });

//     await gotoWithRetry(
//       page,
//       'https://aws.amazon.com/solutions/',
//       {
//         waitUntil: 'networkidle2',
//         timeout: 60000,
//       }
//     );

//     while (totalSolutionsInDatabase < targetNumberOfSolutions) {
//       // 獲取所有卡片元素
//       const cards = await page.$$('.m-card-container');
//       const solutions = [];

//       // 逐個處理卡片
//       for (const card of cards) {
//         // 懸停在卡片上
//         await card.hover();
//         // 等待內容載入
//         await new Promise(resolve => setTimeout(resolve, 500));

//         const solution = await card.evaluate((el) => ({
//           title: el.querySelector('.m-headline a')?.textContent?.trim() || '沒有標題',
//           description: el.querySelector('.m-desc')?.textContent?.trim() || '沒有描述',
//           link: (el.querySelector('.m-headline a') as HTMLAnchorElement)?.href || '沒有連結',
//         }));

//         solutions.push(solution);
//       }

//       for (const solution of solutions) {
//         if (totalSolutionsInDatabase < targetNumberOfSolutions) {
//           if (await saveToDynamoDB(solution)) {
//             totalSolutionsInDatabase++;
//           }
//         } else {
//           break;
//         }
//       }

//       const hasNextPage = await page.$('.pagination-next:not(.disabled)');
//       if (hasNextPage && totalSolutionsInDatabase < targetNumberOfSolutions) {
//         await hasNextPage.click();
//         await new Promise(resolve => setTimeout(resolve, 3000));
//       } else {
//         break;
//       }
//     }

//     console.log(`成功存儲 ${insertedCount} 個新解決方案`);
//     console.log(`跳過了 ${skippedCount} 個已存在的解決方案`);

//     totalSolutionsInDatabase = await countSolutionsInDatabase();
//     console.log(`爬取後資料庫解決方案總數: ${totalSolutionsInDatabase}`);
//   } catch (error) {
//     console.error('爬取過程中發生錯誤:', error instanceof Error ? error.message : error);
//   } finally {
//     if (browser !== null) {
//       await browser.close();
//     }
//   }
// }

// rl.question('請輸入需要爬取的解決方案數量: ', async (answer) => {
//   const numberOfSolutions = parseInt(answer);
//   if (isNaN(numberOfSolutions) || numberOfSolutions <= 0) {
//     console.log('輸入無效，請輸入一個正整數！');
//   } else {
//     await scrapeAWSSolutions(numberOfSolutions);
//   }
//   rl.close();
// }); 