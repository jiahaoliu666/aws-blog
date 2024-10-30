import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
import { extractDateFromInfo } from "@/utils/extractDateFromInfo";

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
  const sortedItems = data.Items.sort((a, b) => {
    const dateA = extractDateFromInfo(a.translated_title.S) || new Date(0);
    const dateB = extractDateFromInfo(b.translated_title.S) || new Date(0);
    return dateB - dateA;
  });
  const latestItems = sortedItems.slice(0, 5);

  return latestItems.map((item) => ({
    content: `<span class="unread-marker">•</span> <a href="/news" class="text-blue-500 hover:underline">[最新新聞]</a> 有新的文章：<a href="${
      item.link.S
    }" class="text-blue-500 hover:underline" target="_blank">${
      item.translated_title.S
    }</a><br><span style="font-size: smaller; color: gray;">${timeAgo(
      item.published_at.N
    )}</span>`,
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
