import { DynamoDBClient, QueryCommand, PutItemCommand, ScanCommand, DeleteItemCommand, UpdateItemCommand, TransactWriteItemsCommand, GetItemCommand } from "@aws-sdk/client-dynamodb";
import { DeleteObjectsCommand, ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";
import { DB_TABLES } from '../config/constants';
import { logger } from '@/utils/logger';

export class DbService {
  private client: DynamoDBClient;
  private s3Client: S3Client;
  private readonly userBucket: string;
  private readonly bucketsToCheck: { bucket: string; prefix: string }[] = [
    { bucket: process.env.USER_UPLOADS_BUCKET || '', prefix: 'users/' },
    { bucket: 'aws-blog-feedback', prefix: 'feedback-attachments/' },
    { bucket: 'aws-blog-avatar', prefix: '' }
  ];

  constructor() {
    this.client = new DynamoDBClient({
      region: process.env.AWS_REGION || 'ap-northeast-1',
    });
    
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || 'ap-northeast-1'
    });
    
    this.userBucket = process.env.USER_UPLOADS_BUCKET || '';
  }

  async getNotificationUsers() {
    const params = {
      TableName: DB_TABLES.USER_NOTIFICATION_SETTINGS,
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

  async deleteUserAccount(userId: string): Promise<void> {
    try {
      logger.info('開始刪除用戶帳號:', { userId });
      
      // 1. 檢查用戶是否存在
      const userExists = await this.checkUserExists(userId);
      if (!userExists) {
        throw new Error('用戶不存在');
      }

      // 2. 先標記用戶為已刪除狀態
      await this.markUserAsDeleted(userId);
      
      // 3. 刪除用戶的 S3 檔案
      await this.deleteUserS3Files(userId);
      
      // 4. 刪除資料庫記錄
      await this.deleteUserRecords(userId);
      
      logger.info('用戶帳號刪除完成:', { userId });
    } catch (error) {
      logger.error('刪除用戶帳號失敗:', { userId, error });
      // 嘗試回滾刪除操作
      await this.rollbackUserDeletion(userId);
      throw error;
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

  private async deleteUserS3Files(userId: string): Promise<void> {
    try {
      // 檢查並刪除所有相關 bucket 中的檔案
      for (const { bucket, prefix } of this.bucketsToCheck) {
        const listCommand = new ListObjectsV2Command({
          Bucket: bucket,
          Prefix: `${prefix}${userId}/`
        });

        const objects = await this.s3Client.send(listCommand);
        
        if (objects.Contents && objects.Contents.length > 0) {
          const deleteCommand = new DeleteObjectsCommand({
            Bucket: bucket,
            Delete: {
              Objects: objects.Contents.map(obj => ({ Key: obj.Key! }))
            }
          });
          
          await this.s3Client.send(deleteCommand);
          logger.info(`已從 ${bucket} 刪除用戶檔案:`, { userId });
        }
      }
    } catch (error) {
      logger.error('刪除用戶 S3 檔案失敗:', { userId, error });
      throw error;
    }
  }

  async deleteUserData(userId: string): Promise<void> {
    try {
      logger.info('開始刪除用戶相關資料:', { userId });

      // 1. 標記用戶為已刪除
      await this.markUserAsDeleted(userId);
      
      // 2. 刪除 S3 檔案
      await this.deleteUserS3Files(userId);
      
      // 3. 刪除資料庫記錄
      await this.deleteUserRecords(userId);

      logger.info('用戶相關資料刪除完成:', { userId });
    } catch (error) {
      logger.error('刪除用戶資料時發生錯誤:', { userId, error });
      // 嘗試回滾刪除操作
      await this.rollbackUserDeletion(userId);
      throw error;
    }
  }

  async deleteUserCompletely(userId: string): Promise<void> {
    try {
      // 1. 檢查用戶是否存在
      const userExists = await this.checkUserExists(userId);
      if (!userExists) {
        throw new Error('用戶不存在');
      }

      // 2. 先標記為已刪除
      await this.markAsDeleted(DB_TABLES.USER_PROFILES, userId);
      
      // 3. 刪除 S3 檔案
      await this.deleteUserS3Files(userId);
      
      // 4. 最後刪除資料庫記錄
      await this.deleteUserRecords(userId);

      logger.info('用戶帳號刪除完成:', { userId });
    } catch (error) {
      logger.error('刪除用戶帳號失敗:', { userId, error });
      // 嘗試回滾刪除操作
      await this.rollbackUserDeletion(userId);
      throw error;
    }
  }

  async markUserAsDeleted(userId: string): Promise<void> {
    const params = {
      TableName: DB_TABLES.USER_PROFILES,
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
      logger.error('標記用戶為已刪除狀態失敗:', { userId, error });
      throw error;
    }
  }

  // 補償機制
  async rollbackUserDeletion(userId: string): Promise<void> {
    try {
      await this.markUserAsActive(userId);
      logger.info('成功回滾用戶刪除操作:', { userId });
    } catch (error) {
      logger.error('回滾用戶刪除操作失敗:', { userId, error });
      throw error;
    }
  }

  private async markUserAsActive(userId: string): Promise<void> {
    const params = {
      TableName: DB_TABLES.USER_PROFILES,
      Key: {
        userId: { S: userId }
      },
      UpdateExpression: 'REMOVE deleted, deletedAt',
    };

    await this.client.send(new UpdateItemCommand(params));
  }

  // 新增檢查用戶是否存在的方法
  private async checkUserExists(userId: string): Promise<boolean> {
    try {
      const params = {
        TableName: DB_TABLES.USER_PROFILES,
        Key: {
          userId: { S: userId }
        }
      };
      
      const command = new GetItemCommand(params);
      const response = await this.client.send(command);
      
      return !!response.Item;
    } catch (error) {
      logger.error('檢查用戶存在失敗:', { userId, error });
      throw error;
    }
  }

  private async deleteUserRecords(userId: string): Promise<void> {
    try {
      const tables = Object.values(DB_TABLES);
      
      // 使用 TransactWriteItems 進行事務性刪除
      const transactItems = tables.map(tableName => ({
        Delete: {
          TableName: tableName,
          Key: {
            userId: { S: userId }
          }
        }
      }));

      // DynamoDB 單次事務最多支援 25 個操作
      const batchSize = 25;
      for (let i = 0; i < transactItems.length; i += batchSize) {
        const batch = transactItems.slice(i, i + batchSize);
        await this.client.send(new TransactWriteItemsCommand({
          TransactItems: batch
        }));
      }
      
      logger.info('已刪除用戶資料庫記錄:', { userId });
    } catch (error) {
      logger.error('刪除用戶資料庫記錄失敗:', { userId, error });
      throw error;
    }
  }

  // 添加事務相關方法
  async beginTransaction(): Promise<void> {
    // DynamoDB 不支援原生事務，這裡可以實現自定義的事務邏輯
    // 或使用 DynamoDB TransactWriteItems
  }

  async commitTransaction(): Promise<void> {
    // 提交事務
  }

  async rollbackTransaction(): Promise<void> {
    // 回滾事務
  }
} 