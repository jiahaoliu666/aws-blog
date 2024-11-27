import { DynamoDBClient, QueryCommand, PutItemCommand, ScanCommand, DeleteItemCommand, UpdateItemCommand, TransactWriteItemsCommand } from "@aws-sdk/client-dynamodb";
import { DB_TABLES } from '../config/constants';
import { logger } from '@/utils/logger';

export class DbService {
  private client: DynamoDBClient;

  constructor() {
    this.client = new DynamoDBClient({
      region: process.env.AWS_REGION || 'ap-northeast-1',
    });
  }

  async getNotificationUsers() {
    const params = {
      TableName: DB_TABLES.NOTIFICATION_SETTINGS,
      FilterExpression: "emailNotification = :true",
      ExpressionAttributeValues: {
        ":true": { BOOL: true },
      },
    };

    try {
      const command = new ScanCommand(params);
      const response = await this.client.send(command);
      return response.Items || [];
    } catch (error) {
      logger.error('獲取通知用戶列表失敗:', error);
      throw error;
    }
  }

  async saveNotificationStatus(userId: string, status: string) {
    const params = {
      TableName: DB_TABLES.USER_NOTIFICATIONS,
      Item: {
        userId: { S: userId },
        status: { S: status },
        timestamp: { N: Date.now().toString() },
      },
    };

    try {
      await this.client.send(new PutItemCommand(params));
    } catch (error) {
      logger.error('保存通知狀態失敗:', error);
      throw error;
    }
  }

  async deleteUserAccount(userId: string) {
    try {
      const timestamp = new Date().toISOString();
      
      // 使用 TransactWriteItems 確保資料一致性
      const transactItems = [
        {
          Update: {
            TableName: DB_TABLES.USERS,
            Key: { userId: { S: userId } },
            UpdateExpression: 'SET deleted = :deleted, deletedAt = :deletedAt, status = :status',
            ExpressionAttributeValues: {
              ':deleted': { BOOL: true },
              ':deletedAt': { S: timestamp },
              ':status': { S: 'DELETED' }
            }
          }
        },
        ...Object.values(DB_TABLES)
          .filter(table => table !== DB_TABLES.USERS)
          .map(table => ({
            Update: {
              TableName: table,
              Key: { userId: { S: userId } },
              UpdateExpression: 'SET deleted = :deleted, deletedAt = :deletedAt',
              ExpressionAttributeValues: {
                ':deleted': { BOOL: true },
                ':deletedAt': { S: timestamp }
              }
            }
          }))
      ];

      await this.client.send(new TransactWriteItemsCommand({ TransactItems: transactItems }));
      logger.info('成功標記用戶資料為已刪除', { userId });
      return true;
    } catch (error) {
      logger.error('刪除用戶資料失敗', { userId, error });
      throw new Error('刪除用戶資料失敗');
    }
  }

  private async markAsDeleted(tableName: string, userId: string) {
    const params = {
      TableName: tableName,
      Key: {
        userId: { S: userId }
      },
      UpdateExpression: 'SET deleted = :deleted, deletedAt = :deletedAt',
      ExpressionAttributeValues: {
        ':deleted': { BOOL: true },
        ':deletedAt': { S: new Date().toISOString() }
      }
    };

    try {
      await this.client.send(new UpdateItemCommand(params));
    } catch (error) {
      logger.error(`標記 ${tableName} 資料為已刪除失敗`, { userId, error });
      throw error;
    }
  }
} 