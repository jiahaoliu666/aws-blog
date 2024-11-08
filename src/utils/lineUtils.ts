import crypto from 'crypto';
import { NextApiRequest } from 'next';
import { lineConfig } from '@/config/line';
import { logger } from '@/utils/logger';

export function verifyLineSignature(req: NextApiRequest): boolean {
  try {
    const signature = req.headers['x-line-signature'] as string;
    if (!signature) {
      logger.error('缺少 LINE 簽章');
      return false;
    }

    const body = JSON.stringify(req.body);
    const hash = crypto
      .createHmac('SHA256', lineConfig.channelSecret)
      .update(body)
      .digest('base64');

    const isValid = hash === signature;
    if (!isValid) {
      logger.error('LINE 簽章驗證失敗', {
        expected: hash,
        received: signature
      });
    }
    return isValid;
  } catch (error) {
    logger.error('驗證 LINE 簽章時發生錯誤:', error);
    return false;
  }
} 