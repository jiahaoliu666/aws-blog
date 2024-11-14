import { NextApiRequest, NextApiResponse } from 'next';
import { DynamoDBClient, GetItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { validateVerificationCode } from '@/utils/lineUtils';
import { logger } from '@/utils/logger';

const dynamoClient = new DynamoDBClient({ region: 'ap-northeast-1' });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: '方法不允許' });
  }

  try {
    const { userId, code } = req.body;

    logger.info('收到驗證請求:', { userId, code });

    // 驗證參數
    if (!userId || !code) {
      return res.status(400).json({
        success: false,
        message: '缺少必要參數'
      });
    }

    // 驗證碼格式檢查
    if (!validateVerificationCode(code)) {
      return res.status(400).json({
        success: false,
        message: '驗證碼格式不正確'
      });
    }

    // 從 DynamoDB 獲取驗證資訊
    const getParams = {
      TableName: "AWS_Blog_UserNotificationSettings",
      Key: {
        userId: { S: userId }
      }
    };

    const result = await dynamoClient.send(new GetItemCommand(getParams));
    
    if (!result.Item) {
      logger.error('找不到用戶驗證資訊:', { userId });
      return res.status(400).json({
        success: false,
        message: '找不到用戶驗證資訊'
      });
    }

    const storedCode = result.Item.verificationCode?.S;
    const expiryTime = Number(result.Item.verificationExpiry?.N || 0);

    // 驗證碼檢查
    if (!storedCode || code !== storedCode) {
      logger.warn('驗證碼不正確:', { userId, inputCode: code });
      return res.status(400).json({
        success: false,
        message: '驗證碼不正確'
      });
    }

    // 檢查是否過期
    if (Date.now() > expiryTime) {
      logger.warn('驗證碼已過期:', { userId, expiryTime });
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
      UpdateExpression: "SET isVerified = :verified, verificationStatus = :status, updatedAt = :updatedAt",
      ExpressionAttributeValues: {
        ":verified": { BOOL: true },
        ":status": { S: "VERIFIED" },
        ":updatedAt": { N: Date.now().toString() }
      }
    };

    await dynamoClient.send(new UpdateItemCommand(updateParams));

    logger.info('驗證成功:', { userId });
    return res.status(200).json({
      success: true,
      message: '驗證成功',
      data: {
        isVerified: true,
        verificationStatus: 'VERIFIED'
      }
    });

  } catch (error) {
    logger.error('驗證處理失敗:', error);
    return res.status(500).json({
      success: false,
      message: '驗證處理失敗，請稍後再試'
    });
  }
} 