import { NextApiRequest, NextApiResponse } from 'next';
import { DynamoDBClient, GetItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { logger } from '@/utils/logger';
import { LineService } from '@/services/lineService';

const dynamoClient = new DynamoDBClient({ region: 'ap-northeast-1' });
const lineService = new LineService();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: '方法不允許' });
  }

  try {
    const { userId, code } = req.body;

    logger.info('收到驗證請求:', { userId, code });

    if (!userId || !code) {
      return res.status(400).json({
        success: false,
        message: '缺少必要參數'
      });
    }

    // 從 DynamoDB 獲取驗證資訊
    const getParams = {
      TableName: "AWS_Blog_UserNotificationSettings",
      Key: {
        userId: { S: userId }
      }
    };

    const getResult = await dynamoClient.send(new GetItemCommand(getParams));
    
    if (!getResult.Item) {
      logger.error('找不到用戶驗證資訊:', { userId });
      return res.status(404).json({
        success: false,
        message: '找不到驗證資訊'
      });
    }

    const storedCode = getResult.Item.verificationCode?.S;
    const expiryTime = Number(getResult.Item.verificationExpiry?.N || 0);

    logger.info('驗證資訊:', {
      storedCode,
      inputCode: code,
      expiryTime,
      currentTime: Date.now()
    });

    // 驗證碼檢查
    if (storedCode !== code) {
      return res.status(400).json({
        success: false,
        message: '驗證碼不正確'
      });
    }

    // 檢查是否過期
    if (Date.now() > expiryTime) {
      return res.status(400).json({
        success: false,
        message: '驗證碼已過期'
      });
    }

    // 更新驗證狀態
    const updateParams = {
      TableName: "AWS_Blog_UserNotificationSettings",
      Key: {
        userId: { S: userId }
      },
      UpdateExpression: "SET isVerified = :verified, verificationStatus = :status, updatedAt = :updatedAt, lastVerifiedAt = :lastVerifiedAt",
      ExpressionAttributeValues: {
        ":verified": { BOOL: true },
        ":status": { S: "VERIFIED" },
        ":updatedAt": { S: new Date().toISOString() },
        ":lastVerifiedAt": { S: new Date().toISOString() }
      }
    };

    await dynamoClient.send(new UpdateItemCommand(updateParams));

    logger.info('驗證成功，資料庫更新完成:', { 
      userId,
      verificationStatus: 'VERIFIED',
      timestamp: new Date().toISOString()
    });

    return res.status(200).json({
      success: true,
      message: '驗證成功',
      data: {
        isVerified: true,
        verificationStatus: 'VERIFIED',
        verifiedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('驗證處理失敗:', error);
    return res.status(500).json({
      success: false,
      message: '系統發生錯誤，請稍後再試'
    });
  }

  if (req.method === 'DELETE') {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: '缺少必要參數'
        });
      }

      // 更新資料庫中的驗證狀態
      const params = {
        TableName: "AWS_Blog_UserNotificationSettings",
        Key: {
          userId: { S: userId }
        },
        UpdateExpression: "SET isVerified = :verified, verificationStatus = :status",
        ExpressionAttributeValues: {
          ":verified": { BOOL: false },
          ":status": { S: "IDLE" }
        }
      };

      await dynamoClient.send(new UpdateItemCommand(params));

      return res.status(200).json({
        success: true,
        message: '驗證狀態已重置'
      });
    } catch (error) {
      console.error('重置驗證狀態失敗:', error);
      return res.status(500).json({
        success: false,
        message: '重置驗證狀態失敗'
      });
    }
  }
} 