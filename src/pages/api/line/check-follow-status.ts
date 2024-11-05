import type { NextApiRequest, NextApiResponse } from 'next';
import { lineConfig } from '@/config/line';
import { logger } from '@/utils/logger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '方法不允許' });
  }

  try {
    const { lineId } = req.body;
    
    if (!lineId) {
      return res.status(400).json({ message: '缺少 LINE ID' });
    }

    // 檢查 LINE Channel Access Token
    if (!lineConfig.channelAccessToken) {
      throw new Error('LINE Channel Access Token 未設定');
    }

    // 使用 LINE Messaging API 檢查好友狀態
    const response = await fetch(`${lineConfig.apiUrl}/profile/${lineId}`, {
      headers: {
        Authorization: `Bearer ${lineConfig.channelAccessToken}`,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return res.status(400).json({ 
          success: false,
          message: '找不到此 LINE ID 或用戶尚未追蹤官方帳號' 
        });
      }
      throw new Error('LINE API 請求失敗');
    }

    const profile = await response.json();
    
    return res.status(200).json({
      success: true,
      message: '驗證成功',
      profile
    });

  } catch (error) {
    logger.error('驗證 LINE ID 時發生錯誤:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '驗證過程發生錯誤'
    });
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