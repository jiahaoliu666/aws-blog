import { DynamoDBClient, QueryCommand, PutItemCommand, ScanCommand, DeleteItemCommand, UpdateItemCommand, TransactWriteItemsCommand, GetItemCommand } from "@aws-sdk/client-dynamodb";
import { DeleteObjectsCommand, ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";
import { DB_TABLES } from '../config/constants';
import { logger } from '@/utils/logger';
import { AuthService } from '@/services/authService';

export class DbService {
  private client: DynamoDBClient;
  private s3Client: S3Client;
  private authService: AuthService;
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
    this.authService = new AuthService();
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

  async deleteUserAccount(userId: string, userSub: string, password: string): Promise<void> {
    try {
      logger.info('開始刪除用戶帳號:', { userId });
      
      // 1. 先檢查用戶是否存在
      const userExists = await this.checkUserExists(userId);
      if (!userExists) {
        throw new Error('用戶不存在');
      }

      // 2. 驗證密碼，如果驗證失敗會直接拋出錯誤並中止流程
      const isPasswordValid = await this.authService.verifyPassword(userSub, password);
      if (!isPasswordValid) {
        throw new Error('密碼錯誤');
      }
      
      logger.info('密碼驗證成功，開始執行刪除流程');
      
      // 3. 開始事務操作
      await this.beginTransaction();
      
      try {
        // 4. 刪除 S3 檔案
        await this.deleteUserS3Files(userId);
        
        // 5. 刪除資料庫記錄
        await this.deleteUserRecords(userId);
        
        // 6. 刪除 Cognito 用戶
        await this.authService.deleteUserWithoutPassword(userSub);
        
        // 7. 提交事務
        await this.commitTransaction();
        
        logger.info('用戶相關資料刪除完成:', { userId });
      } catch (error) {
        // 8. 如果過程中出錯，回滾事務
        await this.rollbackTransaction();
        throw error;
      }
    } catch (error) {
      logger.error('刪除用戶資料時發生錯誤:', { userId, error });
      throw error;
    }
  }

  async markAsDeleted(table: string, userId: string): Promise<void> {
    const params = {
      TableName: table,
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
      logger.error(`標記 ${table} 資料為已刪除失敗`, { userId, error });
      throw error;
    }
  }

  async deleteUserS3Files(userId: string): Promise<void> {
    try {
      logger.info('開始刪除用戶 S3 檔案:', { userId });
      
      for (const { bucket, prefix } of this.bucketsToCheck) {
        const command = new ListObjectsV2Command({
          Bucket: bucket,
          Prefix: `${prefix}${userId}/`
        });
        
        const response = await this.s3Client.send(command);
        
        if (response.Contents && response.Contents.length > 0) {
          const deleteParams = {
            Bucket: bucket,
            Delete: {
              Objects: response.Contents.map(obj => ({ Key: obj.Key! }))
            }
          };
          
          await this.s3Client.send(new DeleteObjectsCommand(deleteParams));
          logger.info(`已從 ${bucket} 刪除 ${response.Contents.length} 個檔案`);
        }
      }
    } catch (error) {
      logger.error('刪除 S3 檔案失敗:', error);
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

  async deleteUserCompletely(userId: string, userSub: string): Promise<void> {
    try {
      logger.info('開始刪除用戶資料:', { userId });
      
      // 刪除所有相關資料表中的記錄
      const tables = [
        DB_TABLES.LINE_VERIFICATIONS,
        DB_TABLES.USER_ACTIVITY_LOG,
        DB_TABLES.USER_FAVORITES,
        DB_TABLES.USER_NOTIFICATIONS,
        DB_TABLES.USER_NOTIFICATION_SETTINGS,
        DB_TABLES.USER_PREFERENCES,
        DB_TABLES.USER_PROFILES,
        DB_TABLES.USER_RECENT_ARTICLES
      ];

      // 使用 Promise.all 並行刪除所有表格中的數據
      await Promise.all(tables.map(async (table) => {
        try {
          const params = {
            TableName: table,
            Key: {
              userId: { S: userId }
            }
          };
          
          await this.client.send(new DeleteItemCommand(params));
          logger.info(`成功從 ${table} 刪除用戶記錄`);
        } catch (error) {
          logger.error(`從 ${table} 刪除記錄失敗:`, error);
          throw error;
        }
      }));

      logger.info('所有用戶資料刪除完成');
      
    } catch (error) {
      logger.error('刪除用戶資料失敗:', error);
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
      logger.info('開始回滾刪除操作:', { userId });
      await this.markUserAsActive(userId);
      logger.info('回滾完成');
    } catch (error) {
      logger.error('回滾操作失敗:', error);
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
      logger.info('開始刪除用戶資料庫記錄:', { userId });
      
      const tables = [
        DB_TABLES.LINE_VERIFICATIONS,
        DB_TABLES.USER_ACTIVITY_LOG,
        DB_TABLES.USER_FAVORITES,
        DB_TABLES.USER_NOTIFICATIONS,
        DB_TABLES.USER_NOTIFICATION_SETTINGS,
        DB_TABLES.USER_PREFERENCES,
        DB_TABLES.USER_PROFILES,
        DB_TABLES.USER_RECENT_ARTICLES
      ];

      for (const table of tables) {
        const params = {
          TableName: table,
          Key: {
            userId: { S: userId }
          }
        };
        
        await this.client.send(new DeleteItemCommand(params));
        logger.info(`已從 ${table} 刪除用戶記錄`);
      }
    } catch (error) {
      logger.error('刪除資料庫記錄失敗:', error);
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