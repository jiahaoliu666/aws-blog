import { NextApiRequest, NextApiResponse } from 'next';
import { DynamoDBClient, PutItemCommand, DeleteItemCommand } from '@aws-sdk/client-dynamodb';
import { logger } from '@/utils/logger';
import crypto from 'crypto';

const dynamoClient = new DynamoDBClient({ region: 'ap-northeast-1' });

// 生成安全的隨機驗證碼
const generateSecureCode = (): string => {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let code = '';
  const randomBytes = crypto.randomBytes(6);
  for (let i = 0; i < 6; i++) {
    code += chars[randomBytes[i] % chars.length];
  }
  return code;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: '方法不允許' });
  }

  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: '缺少必要參數'
      });
    }

    // 先刪除該用戶現有的驗證碼記錄
    try {
      await dynamoClient.send(new DeleteItemCommand({
        TableName: "AWS_Blog_LineVerifications",
        Key: {
          userId: { S: userId }
        }
      }));
    } catch (deleteError) {
      logger.warn('刪除舊驗證碼記錄失敗:', deleteError);
      // 繼續執行，不中斷流程
    }

    // 生成新的驗證碼
    const verificationCode = generateSecureCode();
    const currentTime = Date.now();
    const expiryTime = currentTime + 10 * 60 * 1000; // 10 分鐘後過期

    // 儲存新的驗證碼到資料庫
    const params = {
      TableName: "AWS_Blog_LineVerifications",
      Item: {
        userId: { S: userId },
        verificationCode: { S: verificationCode },
        verificationExpiry: { N: expiryTime.toString() },
        createdAt: { S: new Date(currentTime).toISOString() },
        updatedAt: { S: new Date(currentTime).toISOString() },
        isVerified: { BOOL: false },
        attempts: { N: "0" }
      }
    };

    await dynamoClient.send(new PutItemCommand(params));

    logger.info('新驗證碼已生成:', {
      userId,
      createdAt: new Date(currentTime).toISOString(),
      expiryTime: new Date(expiryTime).toISOString()
    });

    return res.status(200).json({
      success: true,
      verificationCode,
      expiryTime
    });

  } catch (error) {
    logger.error('生成驗證碼失敗:', error);
    return res.status(500).json({
      success: false,
      message: '生成驗證碼失敗，請稍後再試'
    });
  }
} 