import { NextApiRequest, NextApiResponse } from 'next';
import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { logger } from '@/utils/logger';

const dynamoClient = new DynamoDBClient({ region: 'ap-northeast-1' });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: '方法不允許' });
  }

  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: '缺少用戶 ID'
      });
    }

    const params = {
      TableName: "AWS_Blog_UserNotificationSettings",
      Key: {
        userId: { S: userId }
      }
    };

    const result = await dynamoClient.send(new GetItemCommand(params));
    
    return res.status(200).json({
      success: true,
      isVerified: result.Item?.isVerified?.BOOL || false,
      verificationStatus: result.Item?.verificationStatus?.S || 'PENDING'
    });

  } catch (error) {
    logger.error('獲取驗證狀態失敗:', error);
    return res.status(500).json({
      success: false,
      message: '系統發生錯誤'
    });
  }
} 