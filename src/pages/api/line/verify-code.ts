import { NextApiRequest, NextApiResponse } from 'next';
import { DynamoDBClient, GetItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { logger } from '@/utils/logger';

const dynamoClient = new DynamoDBClient({ region: 'ap-northeast-1' });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: '方法不允許' });
  }

  try {
    const { userId, code } = req.body;

    if (!userId || !code) {
      return res.status(400).json({
        success: false,
        message: '缺少必要參數'
      });
    }

    // 從 AWS_Blog_LineVerifications 表中獲取驗證資訊
    const getParams = {
      TableName: "AWS_Blog_LineVerifications",
      Key: {
        userId: { S: userId }
      }
    };

    const result = await dynamoClient.send(new GetItemCommand(getParams));
    
    logger.info('查詢驗證記錄:', {
      userId,
      code,
      result: result.Item
    });

    if (!result.Item) {
      return res.status(400).json({
        success: false,
        message: '請確實發送用戶 ID 或將此問題回報給工程團隊',
        error: 'NOT_FOUND'
      });
    }

    const storedCode = result.Item.verificationCode?.S;
    const expiryTime = Number(result.Item.verificationExpiry?.N || 0);
    const lineId = result.Item.lineId?.S;

    // 檢查驗證碼是否過期
    if (Date.now() > expiryTime) {
      return res.status(400).json({
        success: false,
        message: '驗證碼已過期',
        error: 'EXPIRED'
      });
    }

    // 比對驗證碼
    if (!storedCode || code !== storedCode) {
      // 更新嘗試次數
      await dynamoClient.send(new UpdateItemCommand({
        TableName: "AWS_Blog_LineVerifications",
        Key: { userId: { S: userId } },
        UpdateExpression: "SET attempts = if_not_exists(attempts, :zero) + :inc",
        ExpressionAttributeValues: {
          ":zero": { N: "0" },
          ":inc": { N: "1" }
        }
      }));

      return res.status(400).json({
        success: false,
        message: '驗證碼不正確',
        error: 'INVALID_CODE'
      });
    }

    // 驗證成功，更新狀態
    await dynamoClient.send(new UpdateItemCommand({
      TableName: "AWS_Blog_LineVerifications",
      Key: { userId: { S: userId } },
      UpdateExpression: `
        SET isVerified = :verified,
            verificationStatus = :status,
            verifiedAt = :now,
            updatedAt = :now
      `,
      ExpressionAttributeValues: {
        ":verified": { BOOL: true },
        ":status": { S: "VERIFIED" },
        ":now": { S: new Date().toISOString() }
      }
    }));

    // 檢查 lineId 是否存在
    if (!lineId) {
      throw new Error('找不到 Line ID');
    }

    // 更新用戶通知設定
    await dynamoClient.send(new UpdateItemCommand({
      TableName: "AWS_Blog_UserNotificationSettings",
      Key: { userId: { S: userId } },
      UpdateExpression: `
        SET lineId = :lineId,
            lineNotification = :enabled,
            updatedAt = :now
      `,
      ExpressionAttributeValues: {
        ":lineId": { S: lineId },
        ":enabled": { BOOL: true },
        ":now": { S: new Date().toISOString() }
      }
    }));

    logger.info('驗證成功:', {
      userId,
      lineId,
      verificationStatus: 'VERIFIED'
    });

    return res.status(200).json({
      success: true,
      message: '驗證成功',
      data: {
        lineId,
        isVerified: true,
        status: 'VERIFIED'
      }
    });

  } catch (error) {
    logger.error('驗證處理失敗:', error);
    return res.status(500).json({
      success: false,
      message: '驗證處理失敗，請稍後再試',
      error: error instanceof Error ? error.message : '未知錯誤'
    });
  }
} 