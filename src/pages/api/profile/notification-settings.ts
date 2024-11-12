import { NextApiRequest, NextApiResponse } from 'next';
import { DynamoDB } from 'aws-sdk';
import { logger } from '@/utils/logger';

const dynamodb = new DynamoDB.DocumentClient();
const TABLE_NAME = 'AWS_Blog_UserNotificationSettings';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  try {
    switch (method) {
      case 'GET':
        const { userId } = req.query;
        if (!userId) {
          return res.status(400).json({ message: '缺少使用者ID' });
        }

        const getParams = {
          TableName: TABLE_NAME,
          Key: { userId }
        };

        try {
          const { Item } = await dynamodb.get(getParams).promise();
          return res.status(200).json({
            email: Item?.mail ?? false,
            line: Item?.line ?? false
          });
        } catch (error) {
          logger.error('獲取通知設定失敗:', error);
          throw error;
        }

      case 'PUT':
        const { userId: putUserId, email, line } = req.body;
        
        if (!putUserId) {
          return res.status(400).json({ message: '缺少必要參數' });
        }

        const putParams = {
          TableName: TABLE_NAME,
          Item: {
            userId: putUserId,
            mail: Boolean(email),
            line: Boolean(line),
            updatedAt: new Date().toISOString()
          }
        };

        try {
          await dynamodb.put(putParams).promise();
          logger.info('通知設定已更新:', putParams.Item);
          
          return res.status(200).json({
            email: putParams.Item.mail,
            line: putParams.Item.line
          });
        } catch (error) {
          logger.error('更新通知設定失敗:', error);
          throw error;
        }

      default:
        res.setHeader('Allow', ['GET', 'PUT']);
        return res.status(405).json({ message: `不支援 ${method} 方法` });
    }
  } catch (error) {
    logger.error('通知設定 API 錯誤:', error);
    return res.status(500).json({ message: '伺服器錯誤' });
  }
} 