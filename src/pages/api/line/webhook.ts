// pages/api/line/webhook.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { Client } from '@line/bot-sdk';
import { lineConfig } from '@/config/line';
import { verifyLineSignature } from '@/utils/lineUtils';
import { DynamoDBClient, GetItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { logger } from '@/utils/logger';
import { LineService } from '@/services/lineService';

enum VerificationStep {
  VERIFYING = 'VERIFYING',
  COMPLETED = 'COMPLETED'
}

enum VerificationStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  EXPIRED = 'EXPIRED'
}

const client = new Client({
  channelAccessToken: lineConfig.channelAccessToken,
  channelSecret: lineConfig.channelSecret,
});

const dynamoClient = new DynamoDBClient({ region: 'ap-northeast-1' });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // 驗證 LINE 簽章
    if (!verifyLineSignature(req)) {
      logger.error('LINE 簽章驗證失敗');
      return res.status(401).json({ error: '無效的簽章' });
    }

    const events = req.body.events;
    const lineServiceInstance = new LineService();
    
    for (const event of events) {
      logger.info('收到 LINE 事件:', { event });

      // 處理加入好友事件
      if (event.type === 'follow') {
        try {
          await lineServiceInstance.replyMessage(event.replyToken, [{
            type: 'text',
            text: '歡迎加入！請在聊天室中輸入「驗證」取得您的 LINE ID 和驗證碼。'
          }]);
          continue;
        } catch (error) {
          logger.error('發送歡迎訊息失敗:', error);
        }
      }

      // 處理文字訊息事件
      if (event.type === 'message' && event.message?.type === 'text') {
        const messageText = event.message.text.trim();
        
        if (messageText === '驗證') {
          try {
            const { lineId, verificationCode } = await lineServiceInstance.handleVerificationCommand(event.source.userId!);
            
            // 發送兩條分開的訊息，並使用 flex message 美化顯示
            await lineServiceInstance.replyMessage(event.replyToken, [
              {
                type: 'flex',
                altText: '驗證資訊',
                contents: {
                  type: 'bubble',
                  body: {
                    type: 'box',
                    layout: 'vertical',
                    contents: [
                      {
                        type: 'text',
                        text: '您的驗證資訊',
                        weight: 'bold',
                        size: 'xl',
                        color: '#1DB446'
                      },
                      {
                        type: 'box',
                        layout: 'vertical',
                        margin: 'lg',
                        spacing: 'sm',
                        contents: [
                          {
                            type: 'box',
                            layout: 'horizontal',
                            contents: [
                              {
                                type: 'text',
                                text: 'LINE ID:',
                                size: 'sm',
                                color: '#555555',
                                flex: 0
                              },
                              {
                                type: 'text',
                                text: lineId,
                                size: 'sm',
                                color: '#111111',
                                align: 'end'
                              }
                            ]
                          },
                          {
                            type: 'box',
                            layout: 'horizontal',
                            contents: [
                              {
                                type: 'text',
                                text: '驗證碼:',
                                size: 'sm',
                                color: '#555555',
                                flex: 0
                              },
                              {
                                type: 'text',
                                text: verificationCode,
                                size: 'sm',
                                color: '#111111',
                                align: 'end'
                              }
                            ]
                          }
                        ]
                      },
                      {
                        type: 'text',
                        text: '請在 10 分鐘內完成驗證',
                        size: 'xs',
                        color: '#aaaaaa',
                        wrap: true,
                        margin: 'xxl'
                      }
                    ]
                  }
                }
              }
            ]);

            logger.info('已發送驗證資訊', { lineId, verificationCode });
          } catch (error) {
            logger.error('處理驗證指令失敗:', error);
            await lineServiceInstance.replyMessage(event.replyToken, [{
              type: 'text',
              text: error instanceof Error ? error.message : '抱歉，驗證程序發生錯誤，請稍後再試。'
            }]);
          }
        }
      }
    }

    res.status(200).json({ success: true });
  } catch (error) {
    logger.error('Webhook 處理失敗:', error);
    res.status(500).json({ error: '內部伺服器錯誤' });
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