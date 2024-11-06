import { NextApiRequest, NextApiResponse } from 'next';
import { redis } from '@/utils/redis';
import { logger } from '@/utils/logger';
import { lineService } from '@/services/lineService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: '僅支援 POST 請求' });
    }

    try {
        // 確保 Redis 連接
        if (!redis?.isOpen) {
            await redis?.connect();
        }

        const { lineId, userId } = req.body;

        if (!lineId || !userId) {
            return res.status(400).json({ error: '缺少必要參數' });
        }

        // 檢查追蹤狀態
        const followStatus = await lineService.checkFollowStatus(lineId);
        if (!followStatus.isFollowing) {
            return res.status(400).json({ error: '請先追蹤官方帳號' });
        }

        // 生成驗證碼
        const verificationCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        
        // 儲存驗證碼到 Redis
        const redisKey = `line_verify:${userId}`;
        await redis?.setEx(redisKey, 300, JSON.stringify({
            code: verificationCode,
            lineId,
            timestamp: Date.now()
        }));

        // 發送驗證訊息到 LINE
        await lineService.sendVerificationMessage(lineId, verificationCode);

        res.status(200).json({ success: true, verificationCode });

    } catch (error) {
        logger.error('驗證請求失敗:', error);
        res.status(500).json({ error: '驗證請求失敗' });
    }
}

export const config = {
    api: {
        bodyParser: {
            sizeLimit: '1mb'
        }
    }
}; 