const {
  DynamoDBClient,
  PutItemCommand,
  ScanCommand,
} = require("@aws-sdk/client-dynamodb");
const puppeteer = require("puppeteer");
const { v4: uuidv4 } = require("uuid");
const readline = require("readline");

// 配置 DynamoDB 客戶端
const dbClient = new DynamoDBClient({ region: "ap-northeast-1" });

let insertedCount = 0;
let skippedCount = 0;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// 文章資料結構
async function checkIfExists(title) {
  const scanParams = {
    TableName: "AWS_Blog_News",
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
    return data.Items && data.Items.length > 0 ? true : false; // 確保返回 boolean
  } catch (error) {
    console.error("檢查文章存在時發生錯誤:", error);
    return false; // 捕獲錯誤時返回 false
  }
}

async function countArticlesInDatabase() {
  const scanParams = {
    TableName: "AWS_Blog_News",
  };

  try {
    const data = await dbClient.send(new ScanCommand(scanParams));
    return data.Items ? data.Items.length : 0; // 確保返回數字
  } catch (error) {
    console.error("計數資料庫文章時發生錯誤:", error);
    return 0; // 捕獲錯誤時返回 0
  }
}

async function saveToDynamoDB(article) {
  const exists = await checkIfExists(article.title);
  if (exists) {
    skippedCount++;
    return false; // 表示這篇文章沒有被插入
  }

  const params = {
    TableName: "AWS_Blog_News", // 使用新的表名稱
    Item: {
      article_id: { S: uuidv4() }, // 使用 UUID 作為分區鍵
      title: { S: article.title }, // 使用標題作為排序鍵
      published_at: { N: String(Math.floor(Date.now() / 1000)) },
      info: { S: article.info },
      description: { S: article.description },
      link: { S: article.link },
    },
  };

  try {
    await dbClient.send(new PutItemCommand(params));
    insertedCount++;
    return true; // 表示這篇文章被插入到資料庫
  } catch (error) {
    console.error("插入文章時發生錯誤:", error);
    return false; // 捕獲錯誤時返回 false
  }
}

async function scrapeAWSBlog(targetNumberOfArticles) {
  let browser = null;
  try {
    const initialTotalArticles = await countArticlesInDatabase();
    console.log(`爬取前資料庫共有 ${initialTotalArticles} 篇文章。`);

    let totalArticlesInDatabase = initialTotalArticles;
    if (totalArticlesInDatabase >= targetNumberOfArticles) {
      console.log(
        `資料庫中已經有足夠數量的文章 (${targetNumberOfArticles})，無需再抓取新文章。`
      );
      return;
    }

    browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto("https://aws.amazon.com/blogs/", {
      waitUntil: "networkidle2",
    });

    while (totalArticlesInDatabase < targetNumberOfArticles) {
      const pageData = await page.evaluate(() => {
        const titles = document.querySelectorAll(".m-card-title");
        const infos = document.querySelectorAll(".m-card-info");
        const descriptions = document.querySelectorAll(".m-card-description");
        const links = document.querySelectorAll(".m-card-title a");

        return Array.from(titles).map((titleElem, index) => ({
          title: titleElem.innerText || "沒有標題",
          info: infos[index]?.innerText || "沒有資訊",
          description: descriptions[index]?.innerText || "沒有描述",
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
        const loadMoreButton = await page.$(".m-directories-more-arrow-icon");
        if (loadMoreButton) {
          await loadMoreButton.click();
          await new Promise((resolve) => setTimeout(resolve, 3000));
        } else {
          console.log("沒有更多的文章可供加載。");
          break;
        }
      }
    }

    console.log(`成功將 ${insertedCount} 篇新文章存儲到 DynamoDB.`);
    console.log(`總共跳過了 ${skippedCount} 篇已存在的文章。`);

    totalArticlesInDatabase = await countArticlesInDatabase();
    console.log(`爬取後資料庫目前共有 ${totalArticlesInDatabase} 篇文章。`);
  } catch (error) {
    console.error("爬取過程中發生錯誤:", error);
  } finally {
    if (browser !== null) {
      await browser.close();
    }
  }
}

// 啟動交互詢問
rl.question("請輸入需要爬取的文章數量: ", async (answer) => {
  const numberOfArticles = parseInt(answer);
  if (isNaN(numberOfArticles) || numberOfArticles <= 0) {
    console.log("輸入無效，請輸入一個正整數！");
  } else {
    await scrapeAWSBlog(numberOfArticles);
  }
  rl.close();
});
