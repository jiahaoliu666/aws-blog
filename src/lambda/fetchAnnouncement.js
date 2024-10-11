require("dotenv").config({ path: ".env.local" });

const {
  DynamoDBClient,
  PutItemCommand,
  ScanCommand,
} = require("@aws-sdk/client-dynamodb");
const puppeteer = require("puppeteer");
const { v4: uuidv4 } = require("uuid");
const readline = require("readline");
const OpenAI = require("openai");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const dbClient = new DynamoDBClient({
  region: "ap-northeast-1",
});

let insertedCount = 0;
let skippedCount = 0;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function checkIfExists(title) {
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
      return existingItem.summary && existingItem.summary.S;
    }
    return false;
  } catch (error) {
    console.error("檢查文章存在時發生錯誤:", error);
    return false;
  }
}

async function countArticlesInDatabase() {
  const scanParams = {
    TableName: "AWS_Blog_Announcement",
  };

  try {
    const data = await dbClient.send(new ScanCommand(scanParams));
    return data.Items ? data.Items.length : 0;
  } catch (error) {
    console.error("計數資料庫文章時發生錯誤:", error);
    return 0;
  }
}

async function summarizeArticle(url) {
  const maxTokens = 300;
  const prompt = `使用繁體中文總結這篇文章的內容：${url}`;

  if (prompt.length > 2000) {
    console.warn("請求內容過長，請檢查 URL 或上下文。");
    return "請求內容過長，無法處理。";
  }

  console.log(`正在請求總結文章: ${url}`);
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: maxTokens,
    });
    console.log(`已獲取文章總結: ${url}`);
    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error("總結文章時發生錯誤:", error);
    return "無法獲取總結";
  }
}

async function saveToDynamoDB(article) {
  console.log(`開始處理文章: ${article.title}`);
  const exists = await checkIfExists(article.title);
  if (exists) {
    skippedCount++;
    console.log(`文章已存在，跳過`);
    return false;
  }

  const summary = await summarizeArticle(article.link);

  const params = {
    TableName: "AWS_Blog_Announcement",
    Item: {
      article_id: { S: uuidv4() },
      title: { S: article.title },
      published_at: { N: String(Math.floor(Date.now() / 1000)) },
      info: { S: article.info },
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
    console.error("插入文章時發生錯誤:", error);
    return false;
  }
}

async function gotoWithRetry(page, url, options, retries = 3) {
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

async function scrapeAWSBlog(targetNumberOfArticles) {
  let browser = null;
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
    await gotoWithRetry(
      page,
      "https://aws.amazon.com/tw/about-aws/whats-new/2024/?whats-new-content-all.sort-by=item.additionalFields.postDateTime&whats-new-content-all.sort-order=desc&awsf.whats-new-categories=*all&awsm.page-whats-new-content-all=1",
      {
        waitUntil: "networkidle2",
        timeout: 60000,
      }
    );

    while (totalArticlesInDatabase < targetNumberOfArticles) {
      const pageData = await page.evaluate(() => {
        const titles = document.querySelectorAll(".m-card-title");
        const infos = document.querySelectorAll(".m-card-info");
        const links = document.querySelectorAll(".m-card-title a");

        return Array.from(titles).map((titleElem, index) => ({
          title: titleElem.innerText || "沒有標題",
          info: infos[index]?.innerText || "沒有資訊",
          link: links[index]?.href || "沒有鏈接",
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
        const loadMoreButton = await page.$(".m-icon-angle-right.m-active");
        if (loadMoreButton) {
          await loadMoreButton.click();
          await new Promise((resolve) => setTimeout(resolve, 3000));
        } else {
          console.log("沒有更多的文章可供加載");
          break;
        }
      }
    }

    console.log(`成功存儲 ${insertedCount} 篇新文章`);
    console.log(`跳過了 ${skippedCount} 篇已存在的文章`);

    totalArticlesInDatabase = await countArticlesInDatabase();
    console.log(`爬取後資料庫文章總數: ${totalArticlesInDatabase}`);
  } catch (error) {
    console.error("爬取過程中發生錯誤:", error.message);
  } finally {
    if (browser !== null) {
      await browser.close();
    }
  }
}

rl.question("請輸入需要爬取的文章數量: ", async (answer) => {
  const numberOfArticles = parseInt(answer);
  if (isNaN(numberOfArticles) || numberOfArticles <= 0) {
    console.log("輸入無效，請輸入一個正整數！");
  } else {
    await scrapeAWSBlog(numberOfArticles);
  }
  rl.close();
});
