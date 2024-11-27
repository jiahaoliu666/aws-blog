import { DynamoDBClient, QueryCommand, PutItemCommand, ScanCommand, DeleteItemCommand, UpdateItemCommand, TransactWriteItemsCommand } from "@aws-sdk/client-dynamodb";
import { DeleteObjectsCommand, ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";
import { DB_TABLES } from '../config/constants';
import { logger } from '@/utils/logger';

export class DbService {
  private client: DynamoDBClient;
  private s3Client: S3Client;
  private readonly userBucket: string;

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

      // 需要檢查的所有儲存桶和路徑
      const bucketsToCheck = [
        {
          bucket: 'aws-blog-avatar',
          prefix: `avatars/${userId}/`
        },
        {
          bucket: 'aws-blog-feedback',
          prefix: `feedback-attachments/${userId}/`
        }
      ];

      // 對每個儲存桶進行檔案刪除
      for (const { bucket, prefix } of bucketsToCheck) {
        // 列出該儲存桶中的用戶檔案
        const listParams = {
          Bucket: bucket,
          Prefix: prefix
        };

        const objects = await this.s3Client.send(new ListObjectsV2Command(listParams));

        if (objects.Contents && objects.Contents.length > 0) {
          // 準備刪除指令
          const deleteParams = {
            Bucket: bucket,
            Delete: {
              Objects: objects.Contents.map(obj => ({
                Key: obj.Key
              }))
            }
          };

          await this.s3Client.send(new DeleteObjectsCommand(deleteParams));
          logger.info(`成功從 ${bucket} 刪除用戶檔案:`, {
            userId,
            filesCount: objects.Contents.length
          });
        } else {
          logger.info(`在 ${bucket} 中未找到用戶檔案:`, { userId });
        }
      }

    } catch (error) {
      logger.error('刪除用戶 S3 檔案失敗:', {
        userId,
        error,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }
} 