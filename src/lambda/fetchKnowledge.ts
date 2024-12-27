import dotenv from 'dotenv';
import {
  DynamoDBClient,
  PutItemCommand,
  ScanCommand,
} from '@aws-sdk/client-dynamodb';
import * as puppeteer from 'puppeteer';
import { v4 as uuidv4 } from 'uuid';
import readline from 'readline';
import OpenAI from 'openai';

dotenv.config({ path: '.env.local' });

interface Knowledge {
  title: string;
  description: string;
  link: string;
  info: string;
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const dbClient = new DynamoDBClient({
  region: 'ap-northeast-1',
});

let insertedCount = 0;
let skippedCount = 0;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const DEFAULT_TABLE_NAME = 'AWS_Blog_Knowledge';

async function checkIfExists(title: string): Promise<boolean | string> {
  const scanParams = {
    TableName: process.env.DYNAMODB_KNOWLEDGE_TABLE || DEFAULT_TABLE_NAME,
    FilterExpression: '#title = :title',
    ExpressionAttributeNames: {
      '#title': 'title',
    },
    ExpressionAttributeValues: {
      ':title': { S: title },
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
    console.error('檢查知識文章存在時發生錯誤:', error);
    return false;
  }
}

async function countKnowledgeInDatabase(): Promise<number> {
  const scanParams = {
    TableName: process.env.DYNAMODB_KNOWLEDGE_TABLE || DEFAULT_TABLE_NAME,
  };

  try {
    const data = await dbClient.send(new ScanCommand(scanParams));
    return data.Items ? data.Items.length : 0;
  } catch (error) {
    console.error('計數資料庫知識文章時發生錯誤:', error);
    return 0;
  }
}

async function summarizeKnowledge(url: string): Promise<string> {
  const maxTokens = 200;
  const prompt = `請用繁體中文簡潔扼要地總結這篇 AWS Knowledge Center 文章的主要內容（限 100 字以內）：${url}
要求：
1. 直接說明此知識文章的主要問題和解決方案
2. 只提及關鍵步驟或重要概念
3. 避免贅詞`;

  if (prompt.length > 2000) {
    console.warn('請求內容過長，請檢查 URL 或上下文。');
    return '請求內容過長，無法處理。';
  }

  console.log(`正在請求總結知識文章: ${url}`);
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens,
    });
    console.log(`已獲取知識文章總結: ${url}`);
    return response.choices[0]?.message?.content?.trim() || '無法獲取總結';
  } catch (error) {
    console.error('總結知識文章時發生錯誤:', error);
    return '無法獲取總結';
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

async function saveToDynamoDB(knowledge: Knowledge): Promise<boolean> {
  console.log(`開始處理知識文章: ${knowledge.title}`);
  const exists = await checkIfExists(knowledge.title);
  if (exists) {
    skippedCount++;
    console.log(`知識文章已存在，跳過`);
    return false;
  }

  const summary = await summarizeKnowledge(knowledge.link);
  const translatedTitle = await translateText(knowledge.title);
  const translatedDescription = await translateText(knowledge.description);

  const params = {
    TableName: process.env.DYNAMODB_KNOWLEDGE_TABLE || DEFAULT_TABLE_NAME,
    Item: {
      article_id: { S: uuidv4() },
      title: { S: knowledge.title },
      translated_title: { S: translatedTitle },
      description: { S: knowledge.description },
      translated_description: { S: translatedDescription },
      link: { S: knowledge.link },
      info: { S: knowledge.info },
      summary: { S: summary },
      created_at: { N: String(Math.floor(Date.now() / 1000)) },
    },
  };

  try {
    console.log(`插入知識文章到資料庫`);
    await dbClient.send(new PutItemCommand(params));
    insertedCount++;
    console.log(`知識文章插入成功`);
    return true;
  } catch (error) {
    console.error('插入知識文章時發生錯誤:', error);
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

async function scrapeAWSKnowledge(targetNumberOfArticles: number): Promise<void> {
  let browser: puppeteer.Browser | null = null;
  try {
    const initialTotalArticles = await countKnowledgeInDatabase();
    console.log(`資料庫初始知識文章數量: ${initialTotalArticles}`);

    let totalArticlesInDatabase = initialTotalArticles;
    if (totalArticlesInDatabase >= targetNumberOfArticles) {
      console.log(`資料庫中已有足夠知識文章，無需再抓取`);
      return;
    }

    browser = await puppeteer.launch({ 
      headless: true,
      args: ['--incognito', '--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 1920, height: 1080 }
    });
    const page = await browser.newPage();
    
    page.setDefaultTimeout(30000);
    page.setDefaultNavigationTimeout(30000);

    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36'
    });

    console.log('開始訪問網頁...');
    await gotoWithRetry(
      page,
      'https://repost.aws/knowledge-center/all?view=all&sort=recent',
      {
        waitUntil: 'networkidle0',
        timeout: 60000,
      }
    );

    console.log('等待頁面載入...');
    await page.waitForSelector('.KCArticleCard_card__HW_gu', { timeout: 30000 });
    console.log('頁面已載入');

    while (totalArticlesInDatabase < targetNumberOfArticles) {
      const articles = await page.evaluate(() => {
        const items = document.querySelectorAll('.KCArticleCard_card__HW_gu');
        console.log(`找到 ${items.length} 篇文章`);
        
        return Array.from(items).map(item => {
          const titleElement = item.querySelector('.KCArticleCard_title__dhRk_ a');
          const descriptionElement = item.querySelector('.KCArticleCard_descriptionBody__hLZPL a');
          const infoElement = item.querySelector('[data-test="last-updated"]');
          
          const title = titleElement?.textContent?.trim() || '沒有標題';
          const description = descriptionElement?.textContent?.trim() || '沒有描述';
          const link = titleElement?.getAttribute('href') || '沒有連結';
          const info = infoElement?.textContent?.trim() || '沒有更新資訊';
          
          return { title, description, link, info };
        });
      });

      console.log(`本頁找到 ${articles.length} 篇文章`);

      // 修改 link 以確保完整 URL
      for (const article of articles) {
        if (!article.link.startsWith('http')) {
          article.link = `https://repost.aws${article.link}`;
        }
        console.log('處理文章:', article);
      }

      for (const article of articles) {
        if (totalArticlesInDatabase < targetNumberOfArticles) {
          if (await saveToDynamoDB(article)) {
            totalArticlesInDatabase++;
            console.log(`已處理 ${totalArticlesInDatabase}/${targetNumberOfArticles} 篇文章`);
          }
        } else {
          break;
        }
      }

      const nextButton = await page.$('button[aria-label="Next page"]');
      if (nextButton && totalArticlesInDatabase < targetNumberOfArticles) {
        await nextButton.click();
        await new Promise(resolve => setTimeout(resolve, 3000));
      } else {
        break;
      }
    }

    console.log(`成功存儲 ${insertedCount} 篇新知識文章`);
    console.log(`跳過了 ${skippedCount} 篇已存在的知識文章`);

    totalArticlesInDatabase = await countKnowledgeInDatabase();
    console.log(`爬取後資料庫知識文章總數: ${totalArticlesInDatabase}`);
  } catch (error) {
    console.error('爬取過程中發生錯誤:', error instanceof Error ? error.message : error);
  } finally {
    if (browser !== null) {
      await browser.close();
    }
  }
}

rl.question('請輸入需要爬取的知識文章數量: ', async (answer) => {
  const numberOfArticles = parseInt(answer);
  if (isNaN(numberOfArticles) || numberOfArticles <= 0) {
    console.log('輸入無效，請輸入一個正整數！');
  } else {
    await scrapeAWSKnowledge(numberOfArticles);
  }
  rl.close();
}); 