import { DynamoDBClient, QueryCommand, PutItemCommand, ScanCommand, DeleteItemCommand, UpdateItemCommand, TransactWriteItemsCommand, GetItemCommand, TransactionCanceledException, ResourceNotFoundException } from "@aws-sdk/client-dynamodb";
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
    { bucket: 'aws-blog-avatar', prefix: 'avatars/' }
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

  async handleAccountDeletion(userId: string, userSub: string, password: string): Promise<void> {
    try {
      // 1. 驗證用戶存在性
      const isValid = await this.validateUserKeys(userId);
      if (!isValid) {
        logger.warn('用戶資料不存在，跳過資料庫刪除操作', { userId });
        // 直接進行 Cognito 用戶刪除
        await this.authService.deleteUser(userSub, password);
        return;
      }

      // 2. 標記用戶為已刪除狀態
      await this.markUserAsDeleted(userId);
      
      // 3. 刪除 S3 檔案
      await this.deleteUserS3Files(userId);
      
      // 4. 刪除所有相關資料表中的記錄
      await this.deleteAllUserRecords(userId);
      
      // 5. 刪除 Cognito 用戶
      await this.authService.deleteUser(userSub, password);
      
      logger.info('用戶資料刪除成功:', { userId, userSub });
      
    } catch (error) {
      logger.error('刪除用戶資料失敗:', { userId, userSub, error });
      // 嘗試回滾刪除操作
      await this.rollbackUserDeletion(userId);
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
      logger.error(`標記 ${table} 料為已刪除失敗`, { userId, error });
      throw error;
    }
  }

  private async deleteUserS3Files(userId: string): Promise<void> {
    try {
      logger.info('開始刪除 S3 檔案', { userId });
      
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
          logger.info(`已刪除 ${bucket} 中的檔案`, { count: objects.Contents.length });
        }
      }
    } catch (error) {
      logger.error('刪除 S3 檔案失敗:', error);
      throw error;
    }
  }

  async deleteUserData(userId: string): Promise<void> {
    try {
      // 1. 標記用戶為已刪除
      await this.markUserAsDeleted(userId);
      
      // 2. 刪除 S3 檔案
      await this.deleteUserS3Files(userId);
      
      // 3. 刪除資料庫記錄
      await this.deleteUserRecords(userId);
      
      logger.info('用戶相資料刪除完成', { userId });
    } catch (error) {
      logger.error('刪除用戶資料失敗', { userId, error });
      await this.rollbackUserDeletion(userId);
      throw error;
    }
  }

  async deleteUserCompletely(userId: string, userSub: string, password: string): Promise<void> {
    try {
      // 1. 驗證用戶存在性
      const isValid = await this.validateUserKeys(userId);
      if (!isValid) {
        throw new Error('用戶資料不完整或不存在');
      }

      // 2. 刪除 Cognito 用戶
      await this.authService.deleteUser(userSub, password);
      logger.info('Cognito 用戶刪除成功');

      // 3. 處理有排序索引鍵的表
      await Promise.all([
        this.deleteUserRecordsWithSortKey(userId, DB_TABLES.USER_ACTIVITY_LOG, 'timestamp'),
        this.deleteUserRecordsWithSortKey(userId, DB_TABLES.USER_RECENT_ARTICLES, 'timestamp'),
        this.deleteUserRecordsWithSortKey(userId, DB_TABLES.USER_FAVORITES, 'article_id')
      ]);

      // 4. 處理其他表的刪除
      await this.deleteAllUserRecords(userId);

      // 5. 刪除 S3 檔案
      await this.deleteUserS3Files(userId);

      logger.info('用戶資料完全刪除成功:', { userId });
    } catch (error) {
      logger.error('刪除用戶資料失敗:', { userId, error });
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
    const deletedData = this.deletedUserData.get(userId);
    if (!deletedData) {
      logger.warn('找不到要回滾的資料:', { userId });
      return;
    }

    try {
      logger.info('開始回滾刪除操作:', { userId });
      
      for (const data of deletedData) {
        if (data.oldData) {
          const command = new PutItemCommand({
            TableName: data.table,
            Item: data.oldData
          });
          await this.client.send(command);
          logger.info(`已回滾表 ${data.table} 的資料`);
        }
      }
      
      this.deletedUserData.delete(userId);
      logger.info('回滾操作完成:', { userId });
      
    } catch (error) {
      logger.error('回滾操作失敗:', { userId, error });
      throw new Error('回滾刪除操作失敗');
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

  // 新增查詢用戶是否存在的方法
  private async checkUserExists(userId: string): Promise<boolean> {
    try {
      const params = {
        TableName: DB_TABLES.USER_PROFILES,
        Key: {
          userId: { S: userId }
        },
        ProjectionExpression: 'userId'
      };
      
      const command = new GetItemCommand(params);
      const response = await this.client.send(command);
      
      const exists = !!response.Item;
      logger.info('DynamoDB 用戶檢查結果:', { userId, exists });
      
      return exists;
    } catch (error) {
      logger.error('檢查 DynamoDB 用戶存在失敗:', { 
        userId,
        error: error instanceof Error ? error.message : '未知錯誤',
        stack: error instanceof Error ? error.stack : undefined
      });
      throw new Error('檢查 DynamoDB 用戶存在失敗');
    }
  }

  private async deleteUserRecords(userId: string): Promise<void> {
    try {
      logger.info('開始刪除資料庫記錄', { userId });
      
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
      
      // 使用 Promise.allSettled 來處理刪除操作
      const deletePromises = tables.map(async (tableName) => {
        try {
          const command = new DeleteItemCommand({
            TableName: tableName,
            Key: {
              userId: { S: userId }
            },
            // 移除 ConditionExpression，這樣即使記錄不存在也不會拋出錯誤
          });

          await this.client.send(command);
          return {
            table: tableName,
            success: true
          };
        } catch (error) {
          // 只記錄錯誤，但不中斷流程
          logger.warn(`刪除表 ${tableName} 的記錄時發生錯誤:`, {
            userId,
            error: error instanceof Error ? error.message : '未知錯誤'
          });
          return {
            table: tableName,
            success: false,
            error
          };
        }
      });

      const results = await Promise.allSettled(deletePromises);
      
      // 記錄刪除結果，但不因為個別表格刪除失敗而中斷整個流程
      results.forEach(result => {
        if (result.status === 'fulfilled') {
          const { table, success, error } = result.value;
          if (error) {
            logger.warn(`表 ${table} 刪除時發生錯誤:`, error);
          } else {
            logger.info(`表 ${table} 刪除完成`);
          }
        }
      });

      logger.info('資料庫記錄刪除完成', { userId });
    } catch (error) {
      logger.error('刪除資料庫記錄時發生錯誤:', {
        userId,
        error: error instanceof Error ? error.message : '未知錯誤',
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  // 加事務相關方法
  async beginTransaction(): Promise<void> {
    // DynamoDB 不支援原生事務，這裡可以實現自定義的事務邏輯
    // 或用 DynamoDB TransactWriteItems
  }

  async commitTransaction(): Promise<void> {
    // 提交事務
  }

  async rollbackTransaction(): Promise<void> {
    // 回滾事務
  }

  private async deleteAllUserRecords(userId: string): Promise<void> {
    try {
      // 1. 處理有排序鍵的表
      await Promise.all([
        this.deleteUserRecordsWithSortKey(userId, DB_TABLES.USER_ACTIVITY_LOG, 'timestamp'),
        this.deleteUserRecordsWithSortKey(userId, DB_TABLES.USER_RECENT_ARTICLES, 'timestamp'),
        this.deleteUserRecordsWithSortKey(userId, DB_TABLES.USER_FAVORITES, 'article_id'),
        this.deleteUserRecordsWithSortKey(userId, DB_TABLES.USER_NOTIFICATIONS, 'article_id')
      ]);

      // 2. 處理只有分區鍵的表
      const simpleKeyTables = [
        DB_TABLES.LINE_VERIFICATIONS,
        DB_TABLES.USER_NOTIFICATION_SETTINGS,
        DB_TABLES.USER_PREFERENCES,
        DB_TABLES.USER_PROFILES
      ];

      await Promise.all(simpleKeyTables.map(async (table) => {
        const deleteParams = {
          TableName: table,
          Key: {
            userId: { S: userId }
          }
        };

        try {
          await this.client.send(new DeleteItemCommand(deleteParams));
          logger.info(`成功從表 ${table} 刪除記錄`, { userId });
        } catch (error) {
          if (error instanceof ResourceNotFoundException) {
            logger.warn(`表 ${table} 中找不到記錄`, { userId });
            return;
          }
          throw error;
        }
      }));

    } catch (error) {
      logger.error('刪除用戶記錄失敗:', { userId, error });
      throw error;
    }
  }

  private deletedUserData = new Map<string, any[]>();

  private async validateUserKeys(userId: string): Promise<boolean> {
    try {
      // 只檢查用戶資料表中是否存在該用戶
      const params = {
        TableName: DB_TABLES.USER_PROFILES,
        Key: {
          userId: { S: userId }
        }
      };
      
      const command = new GetItemCommand(params);
      const response = await this.client.send(command);
      
      const exists = !!response.Item;
      logger.info('DynamoDB 用戶檢查結果:', { userId, exists });
      
      return exists;
    } catch (error) {
      logger.error('檢查 DynamoDB 用戶存在失敗:', { 
        userId,
        error: error instanceof Error ? error.message : '未知錯誤',
        stack: error instanceof Error ? error.stack : undefined
      });
      // 當檢查失敗時，返回 false 而不是拋出錯誤
      return false;
    }
  }

  private async deleteUserRecordsWithSortKey(userId: string, table: string, sortKey: string): Promise<void> {
    try {
      const params = {
        TableName: table,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': { S: userId }
        }
      };

      const response = await this.client.send(new QueryCommand(params));

      if (response.Items && response.Items.length > 0) {
        const deletePromises = response.Items.map(item => {
          const deleteParams = {
            TableName: table,
            Key: {
              userId: { S: userId },
              [sortKey]: item[sortKey]
            }
          };
          return this.client.send(new DeleteItemCommand(deleteParams));
        });

        await Promise.allSettled(deletePromises);
        logger.info(`成功從表 ${table} 刪除所有記錄`, { userId });
      }
    } catch (error) {
      logger.error('刪除排序索引鍵記錄失敗:', { userId, table, error });
      throw error;
    }
  }
} 