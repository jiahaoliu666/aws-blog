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
import axios, { AxiosResponse } from 'axios';

dotenv.config({ path: '.env.local' });

interface Article {
  title: string;
  info: string;
  description: string;
  link: string;
}

interface TranslationResponse {
  translations: Array<{
    text: string;
  }>;
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

if (!process.env.MICROSOFT_TRANSLATOR_API_KEY) {
  throw new Error(
    'Microsoft Translator API Key is missing or empty. Please check your .env.local file.'
  );
}

const dbClient = new DynamoDBClient({
  region: 'ap-northeast-1',
});

let insertedCount = 0;
let skippedCount = 0;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function checkIfExists(title: string): Promise<boolean | string> {
  const scanParams = {
    TableName: 'AWS_Blog_News',
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
    console.error('檢查文章存在時發生錯誤:', error);
    return false;
  }
}

async function countArticlesInDatabase(): Promise<number> {
  const scanParams = {
    TableName: 'AWS_Blog_News',
  };

  try {
    const data = await dbClient.send(new ScanCommand(scanParams));
    return data.Items ? data.Items.length : 0;
  } catch (error) {
    console.error('計數資料庫文章時發生錯誤:', error);
    return 0;
  }
}

async function summarizeArticle(url: string): Promise<string> {
  const maxTokens = 300;
  const prompt = `使用繁體中文總結這篇文章的內容：${url}`;

  if (prompt.length > 2000) {
    console.warn('請求內容過長，請檢查 URL 或上下文。');
    return '請求內容過長，無法處理。';
  }

  console.log(`正在請求總結文章: ${url}`);
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens,
    });
    console.log(`已獲取文章總結: ${url}`);
    return response.choices[0]?.message?.content?.trim() || '無法獲取總結';
  } catch (error) {
    console.error('總結文章時發生錯誤:', error);
    return '無法獲取總結';
  }
}

async function translateText(text: string): Promise<string> {
  console.log(`開始翻譯文本`);
  const endpoint = 'https://api.cognitive.microsofttranslator.com';
  const subscriptionKey = process.env.MICROSOFT_TRANSLATOR_API_KEY;
  const location = process.env.MICROSOFT_TRANSLATOR_REGION;

  try {
    const response: AxiosResponse<TranslationResponse[]> = await axios({
      baseURL: endpoint,
      url: '/translate',
      method: 'post',
      headers: {
        'Ocp-Apim-Subscription-Key': subscriptionKey,
        'Ocp-Apim-Subscription-Region': location,
        'Content-type': 'application/json',
        'X-ClientTraceId': uuidv4().toString(),
      },
      params: {
        'api-version': '3.0',
        from: 'en',
        to: 'zh-Hant',
      },
      data: [{ text }],
      responseType: 'json',
    });

    const translatedText = response.data[0].translations[0].text;
    console.log(`翻譯成功`);
    return translatedText;
  } catch (error) {
    console.error(
      '翻譯時發生錯誤:',
      axios.isAxiosError(error) ? error.response?.data : error
    );
    return text;
  }
}

async function saveToDynamoDB(article: Article): Promise<boolean> {
  console.log(`開始處理文章: ${article.title}`);
  const exists = await checkIfExists(article.title);
  if (exists) {
    skippedCount++;
    console.log(`文章已存在，跳過`);
    return false;
  }

  const summary = await summarizeArticle(article.link);
  const translatedTitle = await translateText(article.title);
  const translatedDescription = await translateText(article.description);

  const params = {
    TableName: 'AWS_Blog_News',
    Item: {
      article_id: { S: uuidv4() },
      title: { S: article.title },
      translated_title: { S: translatedTitle },
      published_at: { N: String(Math.floor(Date.now() / 1000)) },
      info: { S: article.info },
      description: { S: article.description },
      translated_description: { S: translatedDescription },
      link: { S: article.link },
      summary: { S: summary },
    },
  };

  try {
    console.log(`插入文章到資料庫`);
    await dbClient.send(new PutItemCommand(params));
    insertedCount++;
    console.log(`文章插入成功`);
    return true;
  } catch (error) {
    console.error('插入文章時發生錯誤:', error);
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

async function scrapeAWSBlog(targetNumberOfArticles: number): Promise<void> {
  let browser: puppeteer.Browser | null = null;
  try {
    const initialTotalArticles = await countArticlesInDatabase();
    console.log(`資料庫初始文章數量: ${initialTotalArticles}`);

    let totalArticlesInDatabase = initialTotalArticles;
    if (totalArticlesInDatabase >= targetNumberOfArticles) {
      console.log(`資料庫中已有足夠文章，無需再抓取`);
      return;
    }

    browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await gotoWithRetry(page, 'https://aws.amazon.com/blogs/', {
      waitUntil: 'networkidle2',
      timeout: 60000,
    });

    while (totalArticlesInDatabase < targetNumberOfArticles) {
      const pageData = await page.evaluate(() => {
        const titles = document.querySelectorAll('.m-card-title');
        const infos = document.querySelectorAll('.m-card-info');
        const descriptions = document.querySelectorAll('.m-card-description');
        const links = document.querySelectorAll('.m-card-title a');

        return Array.from(titles).map((titleElem, index) => ({
          title: titleElem.textContent || '沒有標題',
          info: infos[index]?.textContent || '沒有資訊',
          description: descriptions[index]?.textContent || '沒有描述',
          link: (links[index] as HTMLAnchorElement)?.href || '沒有鏈接',
        }));
      });

      for (const article of pageData) {
        if (totalArticlesInDatabase < targetNumberOfArticles) {
          if (await saveToDynamoDB(article)) {
            totalArticlesInDatabase++;
          }
        } else {
          break;
        }
      }

      if (totalArticlesInDatabase < targetNumberOfArticles) {
        const loadMoreButton = await page.$('.m-directories-more-arrow-icon');
        if (loadMoreButton) {
          await loadMoreButton.click();
          await new Promise((resolve) => setTimeout(resolve, 3000));
        } else {
          console.log('沒有更多的文章可供加載');
          break;
        }
      }
    }

    console.log(`成功存儲 ${insertedCount} 篇新文章`);
    console.log(`跳過了 ${skippedCount} 篇已存在的文章`);

    totalArticlesInDatabase = await countArticlesInDatabase();
    console.log(`爬取後資料庫文章總數: ${totalArticlesInDatabase}`);
  } catch (error) {
    console.error('爬取過程中發生錯誤:', error instanceof Error ? error.message : error);
  } finally {
    if (browser !== null) {
      await browser.close();
    }
  }
}

rl.question('請輸入需要爬取的文章數量: ', async (answer) => {
  const numberOfArticles = parseInt(answer);
  if (isNaN(numberOfArticles) || numberOfArticles <= 0) {
    console.log('輸入無效，請輸入一個正整數！');
  } else {
    await scrapeAWSBlog(numberOfArticles);
  }
  rl.close();
}); 