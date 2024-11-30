import { DynamoDBClient, QueryCommand, PutItemCommand, ScanCommand, DeleteItemCommand, UpdateItemCommand, TransactWriteItemsCommand, GetItemCommand } from "@aws-sdk/client-dynamodb";
import { DeleteObjectsCommand, ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";
import { DB_TABLES } from '../config/constants';
import { logger } from '@/utils/logger';

export class DbService {
  private client: DynamoDBClient;
  private s3Client: S3Client;
  private readonly userBucket: string;
  private readonly bucketsToCheck: { bucket: string; prefix: string }[] = [
    { bucket: process.env.USER_UPLOADS_BUCKET || '', prefix: 'users/' }
    // 如需要檢查其他 bucket，可以在這裡添加
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

  async deleteUserAccount(userId: string) {
    const transactItems = Object.values(DB_TABLES).map(tableName => ({
      Delete: {
        TableName: tableName,
        Key: { userid: { S: userId } }
      }
    }));

    await this.client.send(new TransactWriteItemsCommand({ TransactItems: transactItems }));
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

  async deleteUserS3Files(userId: string): Promise<void> {
    try {
      logger.info('開始刪除用戶 S3 檔案:', { userId });

      for (const { bucket, prefix } of this.bucketsToCheck) {
        let continuationToken: string | undefined;
        let deletedCount = 0;
        
        do {
          const listCommand = new ListObjectsV2Command({
            Bucket: bucket,
            Prefix: `${prefix}${userId}/`,
            MaxKeys: 1000,
            ContinuationToken: continuationToken
          });

          const response = await this.s3Client.send(listCommand);
          
          if (response.Contents && response.Contents.length > 0) {
            const deleteCommand = new DeleteObjectsCommand({
              Bucket: bucket,
              Delete: {
                Objects: response.Contents.map(obj => ({ Key: obj.Key! }))
              }
            });
            
            await this.s3Client.send(deleteCommand);
            deletedCount += response.Contents.length;
            logger.info(`已刪除 ${deletedCount} 個檔案`, { bucket, userId });
          }

          continuationToken = response.NextContinuationToken;
        } while (continuationToken);
      }

      logger.info('用戶 S3 檔案刪除完成:', { userId });
    } catch (error) {
      logger.error('刪除用戶 S3 檔案失敗:', { userId, error });
      throw error;
    }
  }

  async deleteUserData(userId: string): Promise<void> {
    try {
      logger.info('開始刪除用戶相關資料:', { userId });

      // 使用完整的 AWS DynamoDB 表格名稱和正確的 userId 主鍵
      const tables = [
        'AWS_Blog_LineVerifications',
        'AWS_Blog_UserActivityLog',
        'AWS_Blog_UserFavorites',
        'AWS_Blog_UserNotifications',
        'AWS_Blog_UserNotificationSettings',
        'AWS_Blog_UserPreferences',
        'AWS_Blog_UserProfiles',
        'AWS_Blog_UserRecentArticles'
      ];

      const transactionItems = tables.map(tableName => ({
        Delete: {
          TableName: tableName,
          Key: {
            userId: { S: userId }  // 使用正確的 userId 作為主鍵
          }
        }
      }));

      const command = new TransactWriteItemsCommand({
        TransactItems: transactionItems
      });

      await this.client.send(command);
      logger.info('用戶相關資料刪除完成:', { userId });
      
    } catch (error) {
      logger.error('刪除用戶資料時發生錯誤:', { userId, error });
      throw error;
    }
  }

  async deleteUserCompletely(userId: string): Promise<void> {
    try {
      // 1. 檢查用戶是否存在
      const userExists = await this.checkUserExists(userId);
      if (!userExists) {
        logger.warn('刪除用戶時找不到用戶資料:', { userId });
        throw new Error('找不到用戶資料');
      }

      // 2. 標記用戶為已刪除狀態
      await this.markUserAsDeleted(userId);
      logger.info('用戶已標記為已刪除:', { userId });
      
      // 3. 刪除 S3 檔案
      await this.deleteUserS3Files(userId);
      logger.info('用戶 S3 檔案已刪除:', { userId });
      
      // 4. 刪除資料庫資料
      await this.deleteUserData(userId);
      logger.info('用戶資料庫資料已刪除:', { userId });

    } catch (error) {
      logger.error('刪除用戶資料失敗:', { userId, error });
      throw error;
    }
  }

  private async markUserAsDeleted(userId: string): Promise<void> {
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
      logger.info('開始回滾用戶刪除操作:', { userId });

      const updateParams = {
        TableName: DB_TABLES.USER_PROFILES,
        Key: {
          userId: { S: userId }
        },
        UpdateExpression: 'SET deleted = :deleted REMOVE deletedAt',
        ExpressionAttributeValues: {
          ':deleted': { BOOL: false }
        }
      };

      await this.client.send(new UpdateItemCommand(updateParams));
      logger.info('用戶刪除回滾成功:', { userId });

    } catch (error) {
      logger.error('用戶刪除回滾失敗:', { userId, error });
      throw error;
    }
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
      return false;
    }
  }
} 