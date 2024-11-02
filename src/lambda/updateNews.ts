import { EmailService } from '../services/emailService';
import { DB_TABLES } from '../config/constants';
import { logger } from '../utils/logger';
import { dynamoClient } from '../config/aws';
import { ScanCommand } from "@aws-sdk/client-dynamodb";

const emailService = new EmailService();

export const handler = async (event: any) => {
  try {
    // 獲取需要通知的用戶
    const users = await getNotificationUsers();
    
    // 獲取新文章
    const newArticles = await fetchNewArticles();
    
    if (newArticles.length > 0) {
      // 準備通知數據
      const notifications = users
        .filter(user => user.email.S)
        .map(user => ({
          to: user.email.S as string,
          subject: '新的 AWS 部落格文章通知',
          articleData: {
            title: newArticles[0].translated_title.S,
            link: newArticles[0].link.S,
            timestamp: new Date(parseInt(newArticles[0].published_at.N) * 1000).toLocaleString(),
          },
          content: `請查看新的文章：${newArticles[0].translated_title.S}，鏈接：${newArticles[0].link.S}`
        }));

      // 發送通知
      await emailService.sendBatchEmails(notifications);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: '通知發送成功' }),
    };
  } catch (error) {
    logger.error('處理更新時發生錯誤:', error);
    throw error;
  }
};

async function getNotificationUsers() {
  const params = {
    TableName: DB_TABLES.NOTIFICATION_SETTINGS,
    FilterExpression: "emailNotification = :true",
    ExpressionAttributeValues: {
      ":true": { BOOL: true },
    },
  };

  try {
    const command = new ScanCommand(params);
    const response = await dynamoClient.send(command);
    return response.Items || [];
  } catch (error) {
    logger.error('獲取通知用戶列表時發生錯誤:', error);
    throw error;
  }
}

async function fetchNewArticles() {
  // 模擬獲取新文章的邏輯
  return [
    {
      translated_title: { S: "示例文章標題" },
      link: { S: "https://example.com/article" },
      published_at: { N: "1690000000" },
    },
  ];
} 