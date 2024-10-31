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
      const { userId } = req.query;
      const { articles, unreadCount } = await getNewArticles(userId);
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

async function getNewArticles(userId) {
  try {
    const params = {
      TableName: "AWS_Blog_UserNotifications",
      KeyConditionExpression: "userId = :userId",
      ExpressionAttributeValues: {
        ":userId": { S: userId },
      },
    };

    const data = await dbClient.send(new QueryCommand(params));

    if (!data.Items || data.Items.length === 0) {
      return { articles: [], unreadCount: 0 };
    }

    const sortedItems = data.Items.sort(
      (a, b) => b.published_at.N - a.published_at.N
    );
    const latestItems = sortedItems.slice(0, 30);

    const unreadCount = latestItems.filter((item) => !item.read.BOOL).length;

    const articles = await Promise.all(
      latestItems.map(async (item) => {
        const newsParams = {
          TableName: "AWS_Blog_News",
          KeyConditionExpression: "article_id = :article_id",
          ExpressionAttributeValues: {
            ":article_id": { S: item.article_id.S },
          },
        };
        const newsData = await dbClient.send(new QueryCommand(newsParams));

        if (!newsData.Items || newsData.Items.length === 0) {
          return null;
        }

        const newsItem = newsData.Items[0];

        return {
          content: `
          <div class="flex items-center">
            ${
              item.read.BOOL
                ? ""
                : '<span class="inline-block w-2 h-2 bg-blue-500 rounded-full mr-2"></span>'
            }
            <div class="flex-1">
              <a href="/news" class="text-blue-600 hover:text-blue-800 hover:underline transition duration-150">[最新新聞]</a> 有新的文章：
              <a href="${
                newsItem.link.S
              }" class="text-blue-600 hover:text-blue-800 hover:underline transition duration-150" target="_blank"> ${
            newsItem.translated_title.S
          }</a>
              <br>
              <span class="text-sm text-gray-500">${timeAgo(
                newsItem.published_at.N
              )}</span>
            </div>
          </div>
        `,
          read: item.read.BOOL || false,
        };
      })
    );

    return {
      articles: articles.filter((article) => article !== null),
      unreadCount,
    };
  } catch (error) {
    console.error("從 AWS 獲取數據時發生錯誤:", error);
    return { articles: [], unreadCount: 0 };
  }
}

async function markAllNotificationsAsRead(userId) {
  const params = {
    TableName: "AWS_Blog_UserNotifications",
    KeyConditionExpression: "userId = :userId",
    ExpressionAttributeValues: {
      ":userId": { S: userId },
    },
  };

  try {
    const data = await dbClient.send(new QueryCommand(params));
    console.log(`查詢到的通知數量: ${data.Items.length}`);

    const updatePromises = data.Items.map((item) => {
      const updateParams = {
        TableName: "AWS_Blog_UserNotifications",
        Key: {
          userId: { S: userId },
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
      console.log(
        `更新通知: userId=${userId}, article_id=${item.article_id.S}`
      );
      return dbClient.send(new UpdateCommand(updateParams));
    });

    await Promise.all(updatePromises);
    console.log(`所有通知已標記為已讀: userId=${userId}`);
  } catch (error) {
    console.error("更新通知狀態時發生錯誤:", error);
  }
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
