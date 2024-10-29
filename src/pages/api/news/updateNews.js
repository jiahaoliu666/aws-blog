import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";

const dbClient = new DynamoDBClient({ region: "ap-northeast-1" });

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const data = await getNewArticles();
    res.status(200).json(data);
  } catch (error) {
    console.error("獲取文章時發生錯誤:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

async function getNewArticles() {
  const params = {
    TableName: "AWS_Blog_News",
    // 您可以根據需要添加過濾條件
  };

  const data = await dbClient.send(new ScanCommand(params));
  const sortedItems = data.Items.sort(
    (a, b) => b.published_at.N - a.published_at.N
  );
  const latestItems = sortedItems.slice(0, 5);

  return latestItems.map((item) => ({
    title: item.translated_title.S,
    date: new Date(parseInt(item.published_at.N) * 1000).toISOString(),
    content: `有新的文章：${item.translated_title.S} ※${timeAgo(
      item.published_at.N
    )}`,
  }));
}

function timeAgo(timestamp) {
  const seconds = Math.floor(Date.now() / 1000 - timestamp);
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} 分鐘前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小時前`;
  const days = Math.floor(hours / 24);
  return `${days} 天前`;
}
