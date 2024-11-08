// pages/api/line/webhook.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { lineService } from '../../../services/lineService';
import { logger } from '../../../utils/logger';

// 在 lineService 中定義返回類型
interface VerificationResult {
  success: boolean;
  verificationCode: string;
}

// 添加驗證碼訊息模板函數
function createVerificationTemplate(verificationCode: string) {
  return {
    type: 'text' as const,
    text: `您的驗證碼是：${verificationCode}\n請在網站上輸入此驗證碼完成驗證。`
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  try {
    const events = req.body.events;
    
    for (const event of events) {
      // 處理加入好友事件
      if (event.type === 'follow') {
        const lineUserId = event.source.userId;
        await lineService.updateFollowerStatus(lineUserId, true);
        await lineService.sendWelcomeMessage(lineUserId);
      }
      
      // 處理取消追蹤事件
      if (event.type === 'unfollow') {
        const lineUserId = event.source.userId;
        await lineService.updateFollowerStatus(lineUserId, false);
      }

      // 處理文字訊息
      if (event.type === 'message' && event.message.type === 'text') {
        const lineUserId = event.source.userId;
        const messageText = event.message.text;

        // 處理驗證指令
        if (messageText.startsWith('驗證 ')) {
          try {
            const userId = messageText.split(' ')[1];
            if (!userId) {
              await lineService.sendMessage(lineUserId, {
                type: 'text',
                text: '請提供正確的用戶ID，格式：驗證 {用戶ID}'
              });
              return;
            }

            // 生成驗證碼
            const verificationCode = await lineService.generateVerificationCode(userId, lineUserId);
            
            // 發送驗證碼訊息
            await lineService.sendMessage(lineUserId, 
              createVerificationTemplate(verificationCode)
            );

          } catch (error) {
            logger.error('處理驗證指令失敗:', error);
            await lineService.sendMessage(lineUserId, {
              type: 'text',
              text: '處理驗證請求時發生錯誤，請稍後重試。'
            });
          }
        }
      }
    }

    res.status(200).json({ message: 'OK' });
  } catch (error) {
    logger.error('處理 webhook 失敗:', error);
    res.status(500).json({ message: '處理失敗' });
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