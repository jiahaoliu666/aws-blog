import {
  DynamoDBClient,
  ScanCommand,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/client-dynamodb";
import { extractDateFromInfo } from "@/utils/extractDateFromInfo";

const dbClient = new DynamoDBClient({ region: "ap-northeast-1" });

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const { articles, unreadCount } = await getNewArticles();
      res.status(200).json({ articles, unreadCount });
    } catch (error) {
      console.error("獲取文章時發生錯誤:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  } else if (req.method === "POST") {
    try {
      const { userId } = req.body;
      await markAllNotificationsAsRead(userId);
      res.status(200).json({ message: "Notifications marked as read" });
    } catch (error) {
      console.error("更新通知狀態時發生錯誤:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}

async function getNewArticles() {
  const params = {
    TableName: "AWS_Blog_News",
    // 您可以根據需要添加過濾條件
  };

  const data = await dbClient.send(new ScanCommand(params));
  const sortedItems = data.Items.sort((a, b) => {
    return b.published_at.N - a.published_at.N;
  });
  const latestItems = sortedItems.slice(0, 30);

  const unreadCount = latestItems.filter((item) => !item.read).length;

  return {
    articles: latestItems.map((item) => ({
      content: `
        <div class="flex items-center">
          ${
            item.read
              ? ""
              : '<span class="inline-block w-2 h-2 bg-blue-500 rounded-full mr-2"></span>'
          }
          <div class="flex-1">
            <a href="/news" class="text-blue-600 hover:text-blue-800 hover:underline transition duration-150">[最新新聞]</a> 有新的文章：
            <a href="${
              item.link.S
            }" class="text-blue-600 hover:text-blue-800 hover:underline transition duration-150" target="_blank"> ${
        item.translated_title.S
      }</a>
            <br>
            <span class="text-sm text-gray-500">${timeAgo(
              item.published_at.N
            )}</span>
          </div>
        </div>
      `,
      read: item.read || false,
    })),
    unreadCount,
  };
}

async function markAllNotificationsAsRead(userId) {
  const params = {
    TableName: "User_Notifications",
    KeyConditionExpression: "user_id = :userId",
    ExpressionAttributeValues: {
      ":userId": { S: userId },
    },
  };

  const data = await dbClient.send(new QueryCommand(params));
  const updatePromises = data.Items.map((item) => {
    const updateParams = {
      TableName: "User_Notifications",
      Key: {
        user_id: { S: userId },
        article_id: { S: item.article_id.S },
      },
      UpdateExpression: "SET #read = :true",
      ExpressionAttributeNames: {
        "#read": "read",
      },
      ExpressionAttributeValues: {
        ":true": { BOOL: true },
      },
    };
    return dbClient.send(new UpdateCommand(updateParams));
  });

  await Promise.all(updatePromises);
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
