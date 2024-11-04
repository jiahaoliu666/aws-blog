import { NextApiRequest, NextApiResponse } from 'next';
import { lineConfig } from '../../../config/line';
import { logger } from '../../../utils/logger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '方法不允許' });
  }

  const { lineUserId } = req.body;

  if (!lineUserId) {
    return res.status(400).json({ error: '缺少 LINE User ID' });
  }

  try {
    const response = await fetch(
      `https://api.line.me/v2/bot/profile/${lineUserId}`,
      {
        headers: {
          Authorization: `Bearer ${lineConfig.channelAccessToken}`,
        },
      }
    );

    // 更新狀態判斷邏輯
    if (response.status === 200) {
      return res.status(200).json({ isFollowing: true });
    } else if (response.status === 404) {
      return res.status(200).json({ isFollowing: false });
    } else {
      throw new Error('檢查追蹤狀態時發生錯誤');
    }
  } catch (error) {
    logger.error('檢查 LINE 追蹤狀態失敗:', error);
    return res.status(500).json({ error: '檢查追蹤狀態失敗' });
  }
}

// 設定請求大小限制
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb'
    }
  }
}; 