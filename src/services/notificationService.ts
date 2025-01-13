import { DynamoDBClient, UpdateItemCommand, QueryCommand, PutItemCommand, DeleteItemCommand } from "@aws-sdk/client-dynamodb";
import { EmailService } from "./emailService";
import { logger } from "../utils/logger";

const MAX_NOTIFICATIONS = 50;

export class NotificationService {
  private dbClient: DynamoDBClient;
  private emailService: EmailService;

  constructor() {
    this.dbClient = new DynamoDBClient({
      region: 'ap-northeast-1',
      credentials: {
        accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY || '',
      }
    });
    this.emailService = new EmailService();
  }

  async markAllAsRead(userId: string) {
    try {
      const notificationsParams = {
        TableName: "AWS_Blog_UserNotifications",
        KeyConditionExpression: "userId = :userId",
        ExpressionAttributeValues: {
          ":userId": { S: userId }
        }
      };

      const notificationsResult = await this.dbClient.send(new QueryCommand(notificationsParams));

      for (const item of notificationsResult.Items || []) {
        if (!item.article_id.S) continue;
        
        const updateParams = {
          TableName: "AWS_Blog_UserNotifications",
          Key: {
            userId: { S: userId },
            article_id: { S: item.article_id.S }
          },
          UpdateExpression: "SET #read = :true",
          ExpressionAttributeNames: {
            "#read": "read"
          },
          ExpressionAttributeValues: {
            ":true": { BOOL: true }
          }
        };

        await this.dbClient.send(new UpdateItemCommand(updateParams));
      }

      return true;
    } catch (error) {
      logger.error("標記通知已讀時發生錯誤:", error);
      throw error;
    }
  }

  async getUnreadCount(userId: string): Promise<number> {
    try {
      if (!process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID || !process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY) {
        logger.error('AWS credentials not found');
        return 0;
      }

      const params = {
        TableName: "AWS_Blog_UserNotifications",
        KeyConditionExpression: "userId = :userId",
        FilterExpression: "#read = :false",
        ExpressionAttributeNames: {
          "#read": "read"
        },
        ExpressionAttributeValues: {
          ":userId": { S: userId },
          ":false": { BOOL: false }
        }
      };

      const result = await this.dbClient.send(new QueryCommand(params));
      const count = result.Items?.length || 0;
      logger.info(`獲取未讀通知數量: userId=${userId}, count=${count}`);
      return count;
    } catch (error) {
      logger.error("獲取未讀數量失敗:", error);
      return 0;
    }
  }

  async addNotification(userId: string, articleId: string): Promise<void> {
    const params = {
      TableName: "AWS_Blog_UserNotifications",
      Item: {
        userId: { S: userId },
        article_id: { S: articleId },
        read: { BOOL: false },
        created_at: { N: String(Math.floor(Date.now() / 1000)) },
        category: { S: "news" }
      }
    };

    try {
      await this.dbClient.send(new PutItemCommand(params));
      await this.updateUnreadCount(userId);
      await this.cleanupOldNotifications(userId);
      logger.info(`成功新增通知: userId=${userId}, article_id=${articleId}`);
    } catch (error) {
      logger.error("新增通知失敗:", error);
      throw error;
    }
  }

  private async cleanupOldNotifications(userId: string): Promise<void> {
    try {
      // 1. 查詢用戶的所有通知，按照時間戳排序
      const queryParams = {
        TableName: "AWS_Blog_UserNotifications",
        KeyConditionExpression: "userId = :userId",
        ExpressionAttributeValues: {
          ":userId": { S: userId }
        },
        ProjectionExpression: "userId, article_id, created_at",
        ScanIndexForward: false  // 降序排序，最新的在前面
      };

      const result = await this.dbClient.send(new QueryCommand(queryParams));
      const notifications = result.Items || [];

      // 2. 如果通知數量超過50，刪除多餘的舊通知
      if (notifications.length > MAX_NOTIFICATIONS) {
        const notificationsToDelete = notifications.slice(MAX_NOTIFICATIONS);
        
        for (const notification of notificationsToDelete) {
          const deleteParams = {
            TableName: "AWS_Blog_UserNotifications",
            Key: {
              userId: { S: userId },
              article_id: notification.article_id
            }
          };

          await this.dbClient.send(new DeleteItemCommand(deleteParams));
          logger.info(`已刪除舊通知: userId=${userId}, article_id=${notification.article_id.S}`);
        }
      }
    } catch (error) {
      logger.error(`清理舊通知時發生錯誤: userId=${userId}`, error);
      // 不拋出錯誤，因為這是背景清理操作
    }
  }

  async broadcastNewArticle(articleData: any): Promise<void> {
    try {
      // 1. 獲取所有需要通知的用戶
      const users = await this.getNotificationUsers();
      
      // 2. 為每個用戶建立通知記錄
      for (const user of users) {
        const articleId = articleData.article_id?.S;
        const userId = user.userId?.S;
        if (!articleId || !userId) continue;
        await this.addNotification(userId, articleId);
        
        // 3. 發送郵件通知
        if (user.emailNotification?.BOOL) {
          const email = user.email?.S;
          const title = articleData.translated_title?.S;
          const summary = articleData.summary?.S;
          
          if (!email || !title || !summary) continue;
          
          await this.emailService.sendEmail({
            to: email,
            subject: "AWS 部落格新文章通知",
            html: this.generateEmailContent({
              translated_title: { S: title },
              summary: { S: summary }
            })
          });
        }
      }
    } catch (error) {
      logger.error("廣播新文章通知時發生錯誤:", error);
      throw error;
    }
  }

  private async getNotificationUsers() {
    const params = {
      TableName: "AWS_Blog_UserNotificationSettings",
      FilterExpression: "emailNotification = :true",
      ExpressionAttributeValues: {
        ":true": { BOOL: true },
      },
    };

    try {
      const command = new QueryCommand(params);
      const response = await this.dbClient.send(command);
      return response.Items || [];
    } catch (error) {
      logger.error("獲取通知用戶列表時發生錯誤:", error);
      return [];
    }
  }

  private async updateUnreadCount(userId: string): Promise<void> {
    const params = {
      TableName: "AWS_Blog_UserNotifications",
      Key: {
        userId: { S: userId }
      },
      UpdateExpression: "ADD unreadCount :inc",
      ExpressionAttributeValues: {
        ":inc": { N: "1" }
      }
    };

    try {
      await this.dbClient.send(new UpdateItemCommand(params));
    } catch (error) {
      logger.error(`更新用戶 ${userId} 未讀計數失敗:`, error);
    }
  }

  private generateEmailContent(articleData: any): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c5282;">AWS 部落格新文章通知</h2>
        <div style="padding: 20px; background-color: #f7fafc; border-radius: 8px;">
          <h3 style="color: #4a5568;">${articleData.translated_title.S}</h3>
          <p style="color: #718096;">${articleData.summary.S}</p>
          <a href="${articleData.link.S}" 
             style="display: inline-block; padding: 10px 20px; 
                    background-color: #4299e1; color: white; 
                    text-decoration: none; border-radius: 5px; 
                    margin-top: 15px;">
            閱讀全文
          </a>
        </div>
      </div>
    `;
  }
}

export const notificationService = new NotificationService(); 