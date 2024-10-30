import {
  DynamoDBClient,
  QueryCommand,
  UpdateCommand,
  PutItemCommand,
} from "@aws-sdk/client-dynamodb";
import { extractDateFromInfo } from "@/utils/extractDateFromInfo";

const dbClient = new DynamoDBClient({ region: "ap-northeast-1" });

export default async function handler(req, res) {
  const userId = req.query.userId; // 假設用戶 ID 是通過查詢參數傳遞的

  if (req.method === "GET") {
    try {
      const { articles, unreadCount } = await getUserNotifications(userId);
      res.status(200).json({ articles, unreadCount });
    } catch (error) {
      console.error("獲取通知時發生錯誤:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  } else if (req.method === "POST") {
    try {
      await markAllAsRead(userId);
      res.status(200).json({ message: "All notifications marked as read" });
    } catch (error) {
      console.error("更新通知狀態時發生錯誤:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}

async function getUserNotifications(userId) {
  const params = {
    TableName: "AWS_Blog_UserNotifications",
    KeyConditionExpression: "userId = :userId",
    ExpressionAttributeValues: {
      ":userId": { S: userId },
    },
  };

  const data = await dbClient.send(new QueryCommand(params));
  const unreadCount = data.Items.filter((item) => !item.read.BOOL).length;

  return {
    articles: data.Items.map((item) => ({
      article_id: item.article_id.S,
      read: item.read.BOOL,
    })),
    unreadCount,
  };
}

async function markAllAsRead(userId) {
  const params = {
    TableName: "AWS_Blog_UserNotifications",
    KeyConditionExpression: "userId = :userId",
    ExpressionAttributeValues: {
      ":userId": { S: userId },
    },
  };

  const data = await dbClient.send(new QueryCommand(params));
  const updatePromises = data.Items.map((item) => {
    const updateParams = {
      TableName: "AWS_Blog_UserNotifications",
      Key: { userId: item.userId, article_id: item.article_id },
      UpdateExpression: "set read = :r",
      ExpressionAttributeValues: {
        ":r": { BOOL: true },
      },
    };
    return dbClient.send(new UpdateCommand(updateParams));
  });

  await Promise.all(updatePromises);
}

async function addNotification(userId, article_id) {
  const params = {
    TableName: "AWS_Blog_UserNotifications",
    Item: {
      userId: { S: userId },
      article_id: { S: article_id },
      read: { BOOL: false },
    },
  };

  await dbClient.send(new PutItemCommand(params));
}
