import { NextApiRequest, NextApiResponse } from 'next';
import { redis } from '@/utils/redis';
import { logger } from '@/utils/logger';
import { lineService } from '@/services/lineService';
import { createVerificationSuccessTemplate } from '@/templates/lineTemplates';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '僅支援 POST 請求' });
  }

  try {
    const { userId, code } = req.body;

    // 1. 從 Redis 取得驗證資訊
    const redisKey = `line_verify:${userId}`;
    const verificationData = await redis?.get(redisKey);
    
    if (!verificationData) {
      return res.status(400).json({ 
        error: '驗證碼已過期或不存在',
        detail: '請重新發送驗證碼'
      });
    }

    const { code: storedCode, lineId, timestamp } = JSON.parse(verificationData);

    // 2. 檢查驗證碼是否過期（5分鐘）
    if (Date.now() - timestamp > 300000) {
      await redis?.del(redisKey);
      return res.status(400).json({ 
        error: '驗證碼已過期',
        detail: '請重新發送驗證碼'
      });
    }

    // 3. 驗證碼比對
    if (code.toUpperCase() !== storedCode.toUpperCase()) {
      return res.status(400).json({ 
        error: '驗證碼不正確',
        detail: '請確認輸入的驗證碼是否正確'
      });
    }

    // 4. 更新用戶 LINE 設定
    await lineService.updateUserLineSettings({
      userId,
      lineId,
      isVerified: true
    });

    // 5. 刪除 Redis 中的驗證資訊
    await redis?.del(redisKey);

    // 6. 發送成功通知
    await lineService.sendMessage(lineId, createVerificationSuccessTemplate());

    res.status(200).json({ success: true });
  } catch (error) {
    logger.error('驗證確認失敗:', error);
    res.status(500).json({ 
      error: '驗證確認失敗',
      detail: '請稍後再試'
    });
  }
} 