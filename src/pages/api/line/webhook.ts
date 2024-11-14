// pages/api/line/webhook.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { Client } from '@line/bot-sdk';
import { lineConfig } from '@/config/line';
import { verifyLineSignature } from '@/utils/lineUtils';
import { DynamoDBClient, GetItemCommand, PutItemCommand, QueryCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
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
            text: '歡迎加入！請輸入您的用戶ID以開始驗證程序。\n您以在網站的個人設定頁面找到您的用戶ID。'
          }]);
          continue;
        } catch (error) {
          logger.error('發送歡迎訊息失敗:', error);
        }
      }

      // 處理文字訊息事件
      if (event.type === 'message' && event.message?.type === 'text') {
        const messageText = event.message.text.trim();
        
        try {
          // 檢查輸入的是否為有效的 Cognito User ID
          const params = {
            TableName: 'AWS_Blog_UserNotificationSettings',
            Key: {
              userId: { S: messageText }
            }
          };

          const command = new GetItemCommand(params);
          const response = await dynamoClient.send(command);

          // 如果找到對應的用戶ID
          if (response.Item) {
            // 生成驗證碼並儲存
            const { lineId, verificationCode } = await lineServiceInstance.handleVerificationCommand({
              lineUserId: event.source.userId!,
              userId: messageText
            });

            // 計算過期時間
            const expiryTime = new Date(Date.now() + 10 * 60 * 1000);
            const formattedExpiryTime = expiryTime.toLocaleTimeString('zh-TW', {
              hour: '2-digit',
              minute: '2-digit'
            });

            // 發送驗證資訊給用戶
            await lineServiceInstance.replyMessage(event.replyToken, [{
              type: 'flex',
              altText: '驗證資訊',
              contents: {
                type: 'bubble',
                header: {
                  type: 'box',
                  layout: 'vertical',
                  contents: [
                    {
                      type: 'text',
                      text: '🔐 AWS Blog 365 驗證',
                      weight: 'bold',
                      size: 'xl',
                      color: '#FFFFFF'
                    }
                  ],
                  backgroundColor: '#4A90E2',
                  paddingAll: '20px'
                },
                body: {
                  type: 'box',
                  layout: 'vertical',
                  contents: [
                    {
                      type: 'box',
                      layout: 'vertical',
                      spacing: 'xl',
                      contents: [
                        {
                          type: 'box',
                          layout: 'vertical',
                          contents: [
                            {
                              type: 'text',
                              text: '驗證資訊',
                              color: '#8C8C8C',
                              size: 'sm',
                              margin: 'sm'
                            },
                            {
                              type: 'box',
                              layout: 'vertical',
                              margin: 'md',
                              spacing: 'lg',
                              contents: [
                                {
                                  type: 'box',
                                  layout: 'vertical',
                                  spacing: 'sm',
                                  contents: [
                                    {
                                      type: 'text',
                                      text: '👤 LINE ID',
                                      color: '#8C8C8C',
                                      size: 'sm'
                                    },
                                    {
                                      type: 'box',
                                      layout: 'horizontal',
                                      spacing: 'md',
                                      contents: [
                                        {
                                          type: 'text',
                                          text: lineId,
                                          size: 'sm',
                                          color: '#333333',
                                          flex: 5,
                                          wrap: true
                                        },
                                        {
                                          type: 'box',
                                          layout: 'vertical',
                                          contents: [
                                            {
                                              type: 'text',
                                              text: '複製',
                                              size: 'xs',
                                              color: '#FFFFFF',
                                              align: 'center'
                                            }
                                          ],
                                          backgroundColor: '#4A90E2',
                                          cornerRadius: '4px',
                                          paddingAll: '8px',
                                          flex: 1,
                                          action: {
                                            type: 'uri',
                                            uri: `https://line.me/R/oaMessage/@YOUR_BOT_ID/?${lineId}`
                                          }
                                        }
                                      ]
                                    }
                                  ]
                                },
                                {
                                  type: 'box',
                                  layout: 'vertical',
                                  spacing: 'sm',
                                  contents: [
                                    {
                                      type: 'text',
                                      text: '🔑 驗證碼',
                                      color: '#8C8C8C',
                                      size: 'sm'
                                    },
                                    {
                                      type: 'box',
                                      layout: 'horizontal',
                                      spacing: 'md',
                                      contents: [
                                        {
                                          type: 'text',
                                          text: verificationCode,
                                          size: 'xl',
                                          color: '#1DB446',
                                          weight: 'bold',
                                          flex: 5
                                        },
                                        {
                                          type: 'box',
                                          layout: 'vertical',
                                          contents: [
                                            {
                                              type: 'text',
                                              text: '複製',
                                              size: 'xs',
                                              color: '#FFFFFF',
                                              align: 'center'
                                            }
                                          ],
                                          backgroundColor: '#4A90E2',
                                          cornerRadius: '4px',
                                          paddingAll: '8px',
                                          flex: 1,
                                          action: {
                                            type: 'uri',
                                            uri: `https://line.me/R/oaMessage/@YOUR_BOT_ID/?${verificationCode}`
                                          }
                                        }
                                      ],
                                      alignItems: 'center'
                                    }
                                  ]
                                }
                              ]
                            }
                          ]
                        },
                        {
                          type: 'box',
                          layout: 'vertical',
                          contents: [
                            {
                              type: 'text',
                              text: '驗證步驟',
                              color: '#8C8C8C',
                              size: 'sm'
                            },
                            {
                              type: 'box',
                              layout: 'vertical',
                              margin: 'md',
                              spacing: 'sm',
                              contents: [
                                {
                                  type: 'text',
                                  text: '1. 點擊右側複製按鈕複製資訊',
                                  size: 'sm',
                                  color: '#333333'
                                },
                                {
                                  type: 'text',
                                  text: '2. 前往網站的驗證頁面',
                                  size: 'sm',
                                  color: '#333333'
                                },
                                {
                                  type: 'text',
                                  text: '3. 輸入驗證碼完成綁定',
                                  size: 'sm',
                                  color: '#333333'
                                }
                              ]
                            }
                          ]
                        }
                      ]
                    }
                  ],
                  paddingAll: '20px'
                },
                footer: {
                  type: 'box',
                  layout: 'vertical',
                  contents: [
                    {
                      type: 'box',
                      layout: 'vertical',
                      contents: [
                        {
                          type: 'text',
                          text: '⏰ 驗證碼將於',
                          size: 'xs',
                          color: '#8C8C8C',
                          align: 'center'
                        },
                        {
                          type: 'text',
                          text: formattedExpiryTime,
                          size: 'sm',
                          color: '#EF454D',
                          weight: 'bold',
                          align: 'center'
                        },
                        {
                          type: 'text',
                          text: '後失效',
                          size: 'xs',
                          color: '#8C8C8C',
                          align: 'center'
                        }
                      ],
                      spacing: 'sm'
                    }
                  ],
                  paddingAll: '20px'
                },
                styles: {
                  footer: {
                    separator: true
                  }
                }
              }
            }]);

            logger.info('已發送驗證資訊', { lineId, verificationCode });
          } else {
            // 如果找不到對應的用戶ID
            await lineServiceInstance.replyMessage(event.replyToken, [{
              type: 'text',
              text: '無效的用戶ID，請確認您輸入的是正確的用戶ID。\n您可以在網站的個人設定頁面找到您的用戶ID。'
            }]);
          }
        } catch (error) {
          logger.error('處理驗證指令失敗:', error);
          await lineServiceInstance.replyMessage(event.replyToken, [{
            type: 'text',
            text: error instanceof Error ? error.message : '抱歉，驗證程序發生錯誤，請稍後再試。'
          }]);
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