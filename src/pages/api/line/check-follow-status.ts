import { NextApiRequest, NextApiResponse } from 'next';
import { DynamoDBClient, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { lineConfig } from '@/config/line';
import { logger } from '@/utils/logger';

const dynamoClient = new DynamoDBClient({ region: "ap-northeast-1" });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  logger.info('Received request body:', req.body);

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed' 
    });
  }

  const { lineId, userId } = req.body;

  if (!lineId || !userId) {
    logger.error('Missing required parameters:', { lineId, userId });
    return res.status(400).json({
      success: false,
      message: '缺少必要參數：' + (!lineId ? 'LINE ID' : 'User ID')
    });
  }

  try {
    if (!lineConfig.channelAccessToken) {
      logger.error('LINE Channel Access Token is not configured');
      return res.status(500).json({
        success: false,
        message: '系統設定錯誤：未設定 LINE Channel Access Token'
      });
    }

    const lineResponse = await fetch(`https://api.line.me/v2/bot/profile/${lineId}`, {
      headers: {
        'Authorization': `Bearer ${lineConfig.channelAccessToken}`
      }
    });

    if (!lineResponse.ok) {
      logger.error('LINE API error:', await lineResponse.text());
      return res.status(200).json({
        success: false,
        message: '請先掃描 QR Code 並追蹤官方帳號'
      });
    }

    try {
      await updateUserLineId(userId, lineId);
      
      return res.status(200).json({
        success: true,
        message: '驗證成功'
      });
    } catch (dbError) {
      logger.error('Database update error:', dbError);
      return res.status(500).json({
        success: false,
        message: '資料庫更新失敗'
      });
    }

  } catch (error) {
    logger.error('Error in check-follow-status:', error);
    return res.status(500).json({
      success: false,
      message: '驗證過程發生錯誤'
    });
  }
}

async function updateUserLineId(userId: string, lineId: string) {
  const params = {
    TableName: "AWS_Blog_UserNotificationSettings",
    Key: {
      userId: { S: userId }
    },
    UpdateExpression: "SET lineUserId = :lineId, lineNotification = :true",
    ExpressionAttributeValues: {
      ":lineId": { S: lineId },
      ":true": { BOOL: true }
    }
  };

  await dynamoClient.send(new UpdateItemCommand(params));
}

// 設定請求大小限制
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb'
    }
  }
}; 