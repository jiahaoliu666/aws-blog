import { NextApiRequest, NextApiResponse } from 'next';
import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { logger } from '@/utils/logger';

const dynamoClient = new DynamoDBClient({ region: 'ap-northeast-1' });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: '方法不允許' });
  }

  const { userId } = req.query;

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({
      success: false,
      message: '缺少必要參數'
    });
  }

  try {
    const params = {
      TableName: "AWS_Blog_LineVerifications",
      Key: {
        userId: { S: userId }
      }
    };

    const command = new GetItemCommand(params);
    const response = await dynamoClient.send(command);

    if (!response.Item) {
      return res.status(404).json({
        success: false,
        message: '找不到驗證記錄'
      });
    }

    const isVerified = response.Item.isVerified?.BOOL || false;

    return res.status(200).json({
      success: true,
      isVerified,
      updatedAt: response.Item.updatedAt?.S
    });

  } catch (error) {
    logger.error('檢查驗證狀態失敗:', error);
    return res.status(500).json({
      success: false,
      message: '檢查驗證狀態失敗'
    });
  }
} 