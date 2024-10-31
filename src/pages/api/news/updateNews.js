import { DynamoDBClient, QueryCommand } from "@aws-sdk/client-dynamodb";

const dynamoClient = new DynamoDBClient({ region: "ap-northeast-1" });

export default async function handler(req, res) {
  const { userId } = req.query;

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

    console.log(
      "User Notifications Response:",
      JSON.stringify(userNotificationsResponse, null, 2)
    );

    if (
      !userNotificationsResponse.Items ||
      userNotificationsResponse.Items.length === 0
    ) {
      console.log("No notifications found for userId:", userId);
      return res.status(200).json({ articles: [], unreadCount: 0 });
    }

    // 查詢 AWS_Blog_News
    const articles = await Promise.all(
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

        console.log(
          "News Response for article_id:",
          articleId,
          JSON.stringify(newsResponse, null, 2)
        );

        if (newsResponse.Items && newsResponse.Items.length > 0) {
          const newsItem = newsResponse.Items[0];
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
          console.log("No news found for article_id:", articleId);
          return null;
        }
      })
    );

    const filteredArticles = articles
      .filter((article) => article !== null)
      .sort((a, b) => b.published_at - a.published_at);
    const unreadCount = filteredArticles.filter(
      (article) => !article.read
    ).length;

    res.status(200).json({ articles: filteredArticles, unreadCount });
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
