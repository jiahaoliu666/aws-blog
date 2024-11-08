import { NextApiRequest, NextApiResponse } from 'next';
import { DynamoDBClient, GetItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { logger } from '@/utils/logger';

const dynamoClient = new DynamoDBClient({ region: 'ap-northeast-1' });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { userId, lineId, verificationCode } = req.body;

    try {
      // 檢查驗證碼
      const params = {
        TableName: 'AWS_Blog_UserNotificationSettings',
        Key: {
          lineId: { S: lineId }
        }
      };

      const response = await dynamoClient.send(new GetItemCommand(params));
      const item = response.Item;

      if (!item || 
          item.verificationCode.S !== verificationCode ||
          Number(item.verificationExpiry.N) < Date.now()) {
        return res.status(400).json({
          success: false,
          message: '驗證碼無效或已過期'
        });
      }

      // 更新驗證狀態
      await dynamoClient.send(new UpdateItemCommand({
        TableName: 'AWS_Blog_UserNotificationSettings',
        Key: { lineId: { S: lineId } },
        UpdateExpression: 'SET isVerified = :verified, userId = :userId, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':verified': { BOOL: true },
          ':userId': { S: userId },
          ':updatedAt': { S: new Date().toISOString() }
        }
      }));

      res.status(200).json({ success: true });
    } catch (error) {
      logger.error('驗證失敗:', error);
      res.status(500).json({
        success: false,
        message: '驗證過程發生錯誤'
      });
    }
  } else {
    res.status(405).end();
  }
} 