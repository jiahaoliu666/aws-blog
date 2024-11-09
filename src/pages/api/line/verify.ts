import { NextApiRequest, NextApiResponse } from 'next';
import { DynamoDBClient, GetItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { logger } from '@/utils/logger';

enum VerificationStep {
  COMPLETE = 'COMPLETE'
}

enum VerificationStatus {
  SUCCESS = 'SUCCESS'
}

const dynamoClient = new DynamoDBClient({ region: 'ap-northeast-1' });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  const { userId, lineId, verificationCode } = req.body;

  try {
    // 從 DynamoDB 獲取驗證資訊
    const params = {
      TableName: 'AWS_Blog_UserNotificationSettings',
      Key: {
        lineId: { S: lineId }
      }
    };

    const { Item } = await dynamoClient.send(new GetItemCommand(params));

    if (!Item) {
      return res.status(400).json({
        success: false,
        message: '找不到驗證資訊'
      });
    }

    // 驗證碼檢查
    if (Item.verificationCode.S !== verificationCode) {
      return res.status(400).json({
        success: false,
        message: '驗證碼不正確'
      });
    }

    // 檢查是否過期
    if (Number(Item.verificationExpiry.N) < Date.now()) {
      return res.status(400).json({
        success: false,
        message: '驗證碼已過期'
      });
    }

    // 更新驗證狀態
    await dynamoClient.send(new UpdateItemCommand({
      TableName: 'AWS_Blog_UserNotificationSettings',
      Key: { lineId: { S: lineId } },
      UpdateExpression: 'SET isVerified = :verified, userId = :userId, verificationStep = :step, verificationStatus = :status, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':verified': { BOOL: true },
        ':userId': { S: userId },
        ':step': { S: VerificationStep.COMPLETE },
        ':status': { S: VerificationStatus.SUCCESS },
        ':updatedAt': { S: new Date().toISOString() }
      }
    }));

    res.status(200).json({
      success: true,
      message: '驗證成功'
    });
  } catch (error) {
    logger.error('驗證處理失敗:', error);
    res.status(500).json({
      success: false,
      message: '驗證處理發生錯誤'
    });
  }
} 