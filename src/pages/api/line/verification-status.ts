import { NextApiRequest, NextApiResponse } from 'next';
import { DynamoDBClient, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { logger } from '@/utils/logger';

const dynamoClient = new DynamoDBClient({ region: 'ap-northeast-1' });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'PUT') {
    try {
      const { userId, isVerified, verificationStatus } = req.body;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: '缺少必要參數'
        });
      }

      // 更新 DynamoDB
      const params = {
        TableName: "AWS_Blog_UserNotificationSettings",
        Key: {
          userId: { S: userId }
        },
        UpdateExpression: "SET isVerified = :verified",
        ExpressionAttributeValues: {
          ":verified": { BOOL: false }
        }
      };

      await dynamoClient.send(new UpdateItemCommand(params));

      return res.status(200).json({
        success: true,
        message: '驗證狀態已更新'
      });

    } catch (error) {
      logger.error('更新驗證狀態失敗:', error);
      return res.status(500).json({
        success: false,
        message: '更新驗證狀態失敗'
      });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { userId } = req.body;

      const params = {
        TableName: "AWS_Blog_UserNotificationSettings",
        Key: {
          userId: { S: userId }
        },
        UpdateExpression: `
          SET isVerified = :isVerified,
              verificationStatus = :status,
              lineId = :lineId,
              updatedAt = :updatedAt
        `,
        ExpressionAttributeValues: {
          ':isVerified': { BOOL: false },
          ':status': { S: 'IDLE' },
          ':lineId': { S: '' },
          ':updatedAt': { S: new Date().toISOString() }
        }
      };

      await dynamoClient.send(new UpdateItemCommand(params));
      
      res.status(200).json({
        success: true,
        message: '驗證已取消'
      });
    } catch (error) {
      logger.error('取消驗證失敗:', error);
      res.status(500).json({
        success: false,
        message: '取消驗證失敗'
      });
    }
  }

  return res.status(405).json({ message: '方法不允許' });
} 