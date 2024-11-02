import {
  DynamoDBClient,
  QueryCommand,
  DeleteItemCommand,
  UpdateItemCommand,
  PutItemCommand,
} from "@aws-sdk/client-dynamodb";

const dynamoClient = new DynamoDBClient({ region: "ap-northeast-1" });

const MAX_NOTIFICATIONS = 50; // 新增這一行

// 新增獲取需要通知的用戶列表的函數
async function getNotificationUsers(dynamoClient) {
  const params = {
    TableName: "AWS_Blog_UserNotificationSettings",
    FilterExpression: "emailNotification = :true",
    ExpressionAttributeValues: {
      ":true": { BOOL: true },
    },
  };

  try {
    const command = new QueryCommand(params);
    const response = await dynamoClient.send(command);
    return response.Items || [];
  } catch (error) {
    console.error("Error fetching notification users:", error);
    return [];
  }
}

// 在新文章發布時發送郵件通知
async function sendNotifications(users, articleData) {
  for (const user of users) {
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/notifications/sendEmail`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: user.email.S,
            articleData: {
              title: articleData.translated_title.S,
              link: articleData.link.S,
              timestamp: new Date(
                parseInt(articleData.published_at.N) * 1000
              ).toLocaleString(),
            },
          }),
        }
      );
    } catch (error) {
      console.error(`Error sending notification to ${user.email.S}:`, error);
    }
  }
}

export default async function handler(req, res) {
  const { userId } = req.query;

  if (req.method === "POST") {
    try {
      const { userId } = req.body;
      if (!userId) {
        throw new Error("Missing userId in request");
      }

      // 查詢所有通知
      const queryParams = {
        TableName: "AWS_Blog_UserNotifications",
        KeyConditionExpression: "userId = :userId",
        ExpressionAttributeValues: {
          ":userId": { S: userId },
        },
      };

      const queryCommand = new QueryCommand(queryParams);
      const queryResponse = await dynamoClient.send(queryCommand);

      if (queryResponse.Items && queryResponse.Items.length > 0) {
        for (const item of queryResponse.Items) {
          if (!item.read.BOOL) {
            // 過濾未讀通知
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

            const updateCommand = new UpdateItemCommand(updateParams);
            const updateResponse = await dynamoClient.send(updateCommand);
          }
        }
      }

      return res
        .status(200)
        .json({ message: "All notifications marked as read" });
    } catch (error) {
      console.error("Error marking notifications as read:", error);
      return res
        .status(500)
        .json({ error: "Internal Server Error", details: error.message });
    }
  }

  const maxNotifications = MAX_NOTIFICATIONS; // 使用常量

  try {
    // 查詢 AWS_Blog_UserNotifications
    const userNotificationsParams = {
      TableName: "AWS_Blog_UserNotifications",
      KeyConditionExpression: "userId = :userId",
      ExpressionAttributeValues: {
        ":userId": { S: userId },
      },
    };

    const userNotificationsCommand = new QueryCommand(userNotificationsParams);
    const userNotificationsResponse = await dynamoClient.send(
      userNotificationsCommand
    );

    if (
      !userNotificationsResponse.Items ||
      userNotificationsResponse.Items.length === 0
    ) {
      return res.status(200).json({ articles: [], unreadCount: 0 });
    }

    // 查詢 AWS_Blog_News 並根據 published_at 排序
    const notificationsWithTimestamps = await Promise.all(
      userNotificationsResponse.Items.map(async (item) => {
        const articleId = item.article_id.S;
        const newsParams = {
          TableName: "AWS_Blog_News",
          KeyConditionExpression: "article_id = :article_id",
          ExpressionAttributeValues: {
            ":article_id": { S: articleId },
          },
        };

        const newsCommand = new QueryCommand(newsParams);
        const newsResponse = await dynamoClient.send(newsCommand);

        if (newsResponse.Items && newsResponse.Items.length > 0) {
          const newsItem = newsResponse.Items[0];
          return {
            article_id: articleId,
            published_at: parseInt(newsItem.published_at.N, 10),
          };
        }
        return null;
      })
    );

    const sortedNotifications = notificationsWithTimestamps
      .filter((item) => item !== null)
      .sort((a, b) => a.published_at - b.published_at);

    // 如果通知數量超過限制，刪除最舊的通知
    if (sortedNotifications.length > maxNotifications) {
      const itemsToDelete = sortedNotifications.slice(
        0,
        sortedNotifications.length - maxNotifications
      );
      for (const item of itemsToDelete) {
        const deleteParams = {
          TableName: "AWS_Blog_UserNotifications",
          Key: {
            userId: { S: userId },
            article_id: { S: item.article_id },
          },
        };
        const deleteCommand = new DeleteItemCommand(deleteParams);
        await dynamoClient.send(deleteCommand);
      }
    }

    // 查詢 AWS_Blog_News
    const articles = await Promise.all(
      userNotificationsResponse.Items.map(async (item, index) => {
        const articleId = item.article_id.S;
        const newsParams = {
          TableName: "AWS_Blog_News",
          KeyConditionExpression: "article_id = :article_id",
          ExpressionAttributeValues: {
            ":article_id": { S: articleId },
          },
        };

        const newsCommand = new QueryCommand(newsParams);
        const newsResponse = await dynamoClient.send(newsCommand);

        if (newsResponse.Items && newsResponse.Items.length > 0) {
          const newsItem = newsResponse.Items[0];
          return {
            content: `
              <div class="flex items-center">
                <div class="flex-1">
                  <a href="/news" class="text-blue-600 hover:text-blue-800 hover:underline transition duration-150">[最新新聞]</a> 有新的文章：
                  <a href="${
                    newsItem.link.S
                  }" class="text-blue-600 hover:text-blue-800 hover:underline transition duration-150" target="_blank"> ${
              newsItem.translated_title.S
            }</a>
                  <br>
                  <span class="text-sm text-gray-500">${
                    newsItem.published_at.N
                      ? timeAgo(newsItem.published_at.N)
                      : ""
                  }</span>
                </div>
              </div>
            `,
            read: item.read.BOOL || false,
            published_at: parseInt(newsItem.published_at.N, 10),
          };
        } else {
          return null;
        }
      })
    );

    const filteredArticles = articles
      .filter((article) => article !== null)
      .sort((a, b) => b.published_at - a.published_at)
      .slice(0, maxNotifications);
    const unreadCount = filteredArticles.filter(
      (article) => !article.read
    ).length;
    const totalCount = userNotificationsResponse.Items.length; // 新增這一行

    res
      .status(200)
      .json({ articles: filteredArticles, unreadCount, totalCount }); // 修改這一行

    // 在成功添加新文章後
    if (filteredArticles.length > 0) {
      const notificationUsers = await getNotificationUsers(dynamoClient);
      await sendNotifications(notificationUsers, filteredArticles[0]);
    }
  } catch (error) {
    console.error("Error fetching news:", error);
    res.status(500).json({ error: "Internal Server Error" });
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

// 修改 saveToDynamoDB 函數
async function saveToDynamoDB(article) {
  // ... 現有代碼 ...
  try {
    await dbClient.send(new PutItemCommand(params));
    insertedCount++;

    // 獲取需要通知的用戶
    const notificationUsers = await getNotificationUsers(dynamoClient);

    // 發送郵件通知
    for (const user of notificationUsers) {
      try {
        await fetch(`${process.env.API_URL}/api/notifications/sendEmail`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: user.email.S,
            articleData: {
              title: translatedTitle,
              link: article.link,
              timestamp: new Date().toLocaleString(),
            },
          }),
        });
      } catch (error) {
        console.error(`發送郵件通知失敗: ${error}`);
      }
    }

    return true;
  } catch (error) {
    // ... 錯誤處理 ...
  }
}
