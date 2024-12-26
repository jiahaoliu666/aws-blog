import dotenv from 'dotenv';
import {
  DynamoDBClient,
  PutItemCommand,
  ScanCommand,
  DescribeTableCommand,
  ResourceNotFoundException,
} from '@aws-sdk/client-dynamodb';
import * as puppeteer from 'puppeteer';
import { v4 as uuidv4 } from 'uuid';
import readline from 'readline';
import OpenAI from 'openai';

dotenv.config({ path: '.env.local' });

interface Architecture {
  title: string;
  description: string;
  link: string;
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

const DEFAULT_TABLE_NAME = 'AWS_Blog_Architecture';

async function checkIfExists(title: string): Promise<boolean | string> {
  const scanParams = {
    TableName: process.env.DYNAMODB_ARCHITECTURE_TABLE || DEFAULT_TABLE_NAME,
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
    if (error instanceof Error && 
        error.name === 'ResourceNotFoundException') {
      console.log('資料表不存在，請先建立資料表');
      process.exit(1);
    }
    console.error('檢查架構存在時發生錯誤:', error);
    return false;
  }
}

async function countArchitecturesInDatabase(): Promise<number> {
  const scanParams = {
    TableName: process.env.DYNAMODB_ARCHITECTURE_TABLE || DEFAULT_TABLE_NAME,
  };

  try {
    const data = await dbClient.send(new ScanCommand(scanParams));
    return data.Items ? data.Items.length : 0;
  } catch (error) {
    if (error instanceof Error && 
        error.name === 'ResourceNotFoundException') {
      console.log('資料表不存在，請先建立資料表');
      process.exit(1);
    }
    console.error('計數資料庫架構時發生錯誤:', error);
    return 0;
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
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens,
    });
    console.log(`已獲取架構總結: ${url}`);
    return response.choices[0]?.message?.content?.trim() || '無法獲取總結';
  } catch (error) {
    console.error('總結架構時發生錯誤:', error);
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

  const params = {
    TableName: process.env.DYNAMODB_ARCHITECTURE_TABLE || DEFAULT_TABLE_NAME,
    Item: {
      article_id: { S: uuidv4() },
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
    console.log(`架構插入成功`);
    return true;
  } catch (error) {
    console.error('插入架構時發生錯誤:', error);
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

async function scrapeAWSArchitectures(targetNumberOfArchitectures: number): Promise<void> {
  let browser: puppeteer.Browser | null = null;
  try {
    const initialTotalArchitectures = await countArchitecturesInDatabase();
    console.log(`資料庫初始架構數量: ${initialTotalArchitectures}`);

    let totalArchitecturesInDatabase = initialTotalArchitectures;
    if (totalArchitecturesInDatabase >= targetNumberOfArchitectures) {
      console.log(`資料庫中已有足夠架構，無需再抓取`);
      return;
    }

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
      'https://aws.amazon.com/architecture/?cards-all.sort-by=item.additionalFields.sortDate&cards-all.sort-order=desc&awsf.content-type=content-type%23reference-arch-diagram&awsf.methodology=*all&awsf.tech-category=*all&awsf.industries=*all&awsf.business-category=*all',
      {
        waitUntil: 'networkidle2',
        timeout: 60000,
      }
    );

    while (totalArchitecturesInDatabase < targetNumberOfArchitectures) {
      // 獲取所有卡片元素
      const cards = await page.$$('.m-card-container');
      const architectures = [];

      // 逐個處理卡片
      for (const card of cards) {
        // 懸停在卡片上
        await card.hover();
        // 等待內容載入
        await new Promise(resolve => setTimeout(resolve, 500));

        const architecture = await card.evaluate((el) => ({
          title: el.querySelector('.m-headline a')?.textContent?.trim() || '沒有標題',
          description: el.querySelector('.m-desc')?.textContent?.trim() || '沒有描述',
          link: (el.querySelector('.m-headline a') as HTMLAnchorElement)?.href || '沒有連結',
        }));

        architectures.push(architecture);
      }

      for (const architecture of architectures) {
        if (totalArchitecturesInDatabase < targetNumberOfArchitectures) {
          if (await saveToDynamoDB(architecture)) {
            totalArchitecturesInDatabase++;
          }
        } else {
          break;
        }
      }

      const hasNextPage = await page.$('.pagination-next:not(.disabled)');
      if (hasNextPage && totalArchitecturesInDatabase < targetNumberOfArchitectures) {
        await hasNextPage.click();
        await new Promise(resolve => setTimeout(resolve, 3000));
      } else {
        break;
      }
    }

    console.log(`成功存儲 ${insertedCount} 個新架構`);
    console.log(`跳過了 ${skippedCount} 個已存在的架構`);

    totalArchitecturesInDatabase = await countArchitecturesInDatabase();
    console.log(`爬取後資料庫架構總數: ${totalArchitecturesInDatabase}`);
  } catch (error) {
    console.error('爬取過程中發生錯誤:', error instanceof Error ? error.message : error);
  } finally {
    if (browser !== null) {
      await browser.close();
    }
  }
}

rl.question('請輸入需要爬取的架構數量: ', async (answer) => {
  const numberOfArchitectures = parseInt(answer);
  if (isNaN(numberOfArchitectures) || numberOfArchitectures <= 0) {
    console.log('輸入無效，請輸入一個正整數！');
  } else {
    await scrapeAWSArchitectures(numberOfArchitectures);
  }
  rl.close();
}); 

