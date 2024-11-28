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

  async deleteUserWithTransaction(userId: string): Promise<void> {
    try {
      logger.info('開始刪除用戶事務:', { userId });

      // 準備事務項目
      const transactItems = [
        {
          Delete: {
            TableName: DB_TABLES.USER_PROFILES,
            Key: { userId: { S: userId } }
          }
        },
        {
          Delete: {
            TableName: DB_TABLES.USER_NOTIFICATION_SETTINGS,
            Key: { userId: { S: userId } }
          }
        },
        // ... 其他需要刪除的表
      ];

      const command = new TransactWriteItemsCommand({
        TransactItems: transactItems
      });

      await this.client.send(command);
      logger.info('用戶資料事務刪除成功:', { userId });

    } catch (error) {
      logger.error('用戶資料事務刪除失敗:', { userId, error });
      throw error;
    }
  }

  async deleteUserS3Files(userId: string): Promise<void> {
    try {
      logger.info('開始刪除用戶 S3 檔案:', { userId });

      for (const { bucket, prefix } of this.bucketsToCheck) {
        let continuationToken: string | undefined;
        
        do {
          // 使用分頁處理列出物件
          const listCommand = new ListObjectsV2Command({
            Bucket: bucket,
            Prefix: prefix,
            MaxKeys: 1000, // 每頁最大項目數
            ContinuationToken: continuationToken
          });

          const response = await this.s3Client.send(listCommand);
          
          if (response.Contents && response.Contents.length > 0) {
            // 批次處理刪除
            const deleteCommand = new DeleteObjectsCommand({
              Bucket: bucket,
              Delete: {
                Objects: response.Contents.map(obj => ({ Key: obj.Key }))
              }
            });

            await this.s3Client.send(deleteCommand);
            logger.info(`已刪除 ${response.Contents.length} 個檔案`, { bucket });
          }

          continuationToken = response.NextContinuationToken;
        } while (continuationToken);
      }

    } catch (error) {
      logger.error('刪除用戶 S3 檔案失敗:', { userId, error });
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