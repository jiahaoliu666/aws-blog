import { DynamoDBClient, QueryCommand, PutItemCommand, ScanCommand, DeleteItemCommand, UpdateItemCommand, TransactWriteItemsCommand } from "@aws-sdk/client-dynamodb";
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

  async deleteUserWithTransaction(userId: string): Promise<void> {
    try {
      logger.info('開始刪除用戶資料:', { userId });

      const transactItems = Object.values(DB_TABLES)
        .filter(table => table !== DB_TABLES.USER_PROFILES) // 排除用戶資料表
        .map(tableName => ({
          Delete: {
            TableName: tableName,
            Key: { userId: { S: userId } }
          }
        }));

      // 最後刪除用戶資料表
      transactItems.push({
        Delete: {
          TableName: DB_TABLES.USER_PROFILES,
          Key: { userId: { S: userId } }
        }
      });

      const command = new TransactWriteItemsCommand({
        TransactItems: transactItems
      });

      await this.client.send(command);
      logger.info('用戶資料刪除完成:', { userId });
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
} 