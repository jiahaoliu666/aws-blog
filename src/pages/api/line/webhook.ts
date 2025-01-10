// pages/api/line/webhook.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { Client } from '@line/bot-sdk';
import { lineConfig } from '@/config/line';
import { verifyLineSignature } from '@/utils/lineUtils';
import { DynamoDBClient, GetItemCommand, PutItemCommand, QueryCommand, UpdateItemCommand, ScanCommand } from '@aws-sdk/client-dynamodb';
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
  logger.info('收到 LINE Webhook 請求', {
    method: req.method,
    headers: req.headers,
    body: req.body,
    url: req.url,
    timestamp: new Date().toISOString(),
    config: {
      hasChannelAccessToken: !!lineConfig.channelAccessToken,
      hasChannelSecret: !!lineConfig.channelSecret,
      webhookUrl: lineConfig.webhookUrl,
      environment: process.env.NODE_ENV
    }
  });

  try {
    // 檢查 LINE 配置
    logger.info('LINE 配置檢查', {
      hasChannelAccessToken: !!lineConfig.channelAccessToken,
      hasChannelSecret: !!lineConfig.channelSecret,
      webhookUrl: lineConfig.webhookUrl,
      environment: process.env.NODE_ENV
    });

    // 驗證 LINE 簽章
    if (!verifyLineSignature(req)) {
      logger.error('LINE 簽章驗證失敗', {
        signature: req.headers['x-line-signature'],
        body: req.body,
        timestamp: new Date().toISOString()
      });
      return res.status(401).json({ error: '無效的簽章' });
    }

    logger.info('LINE 簽章驗證成功');

    const events = req.body.events;
    const lineServiceInstance = new LineService();
    
    for (const event of events) {
      logger.info('處理 LINE 事件:', { 
        eventType: event.type,
        userId: event.source.userId,
        timestamp: new Date(event.timestamp).toISOString()
      });

      // 處理加入好友事件
      if (event.type === 'follow') {
        try {
          await lineServiceInstance.replyMessage(event.replyToken, [{
            type: 'text',
            text: '歡迎加入！請輸入您的用戶ID以開始驗證程序。\n您可以在網站的個人設定頁面找到您的用戶ID。'
          }]);
          logger.info('已發送歡迎訊息', {
            userId: event.source.userId,
            timestamp: new Date().toISOString()
          });
          continue;
        } catch (error) {
          logger.error('發送歡迎訊息失敗:', error);
        }
      }

      // 處理文字訊息事件
      if (event.type === 'message' && event.message?.type === 'text') {
        const messageText = event.message.text.trim();
        
        logger.info('收到文字訊息:', {
          userId: event.source.userId,
          message: messageText,
          timestamp: new Date().toISOString()
        });
        
        try {
          // 檢查是否為驗證碼
          const verificationCodePattern = /^[0-9A-Z]{6}$/;
          if (verificationCodePattern.test(messageText)) {
            logger.info('檢測到驗證碼格式的訊息:', { code: messageText });
            
            // 使用 Scan 操作查詢未驗證的記錄
            const scanParams = {
              TableName: "AWS_Blog_LineVerifications",
              FilterExpression: "verificationCode = :code AND isVerified = :isVerified",
              ExpressionAttributeValues: {
                ":code": { S: messageText },
                ":isVerified": { BOOL: false }
              }
            };

            const scanCommand = new ScanCommand(scanParams);
            const scanResponse = await dynamoClient.send(scanCommand);

            if (scanResponse.Items && scanResponse.Items.length > 0) {
              const verificationRecord = scanResponse.Items[0];
              const userId = verificationRecord.userId.S;
              const expiryTime = Number(verificationRecord.verificationExpiry.N || 0);

              logger.info('找到驗證記錄:', {
                userId,
                expiryTime,
                currentTime: Date.now(),
                isExpired: Date.now() > expiryTime
              });

              // 檢查驗證碼是否過期
              if (Date.now() <= expiryTime) {
                // 更新驗證狀態
                const updateParams = {
                  TableName: "AWS_Blog_LineVerifications",
                  Key: {
                    userId: { S: userId || '' }
                  },
                  UpdateExpression: "SET isVerified = :verified, verificationStatus = :status, updatedAt = :now",
                  ExpressionAttributeValues: {
                    ":verified": { BOOL: true },
                    ":status": { S: "VERIFIED" },
                    ":now": { S: new Date().toISOString() }
                  }
                };

                await dynamoClient.send(new UpdateItemCommand(updateParams));

                // 更新用戶通知設定
                const notificationParams = {
                  TableName: "AWS_Blog_UserNotificationSettings",
                  Item: {
                    userId: { S: userId || '' },
                    lineId: { S: event.source.userId || '' },
                    lineNotification: { BOOL: true },
                    updatedAt: { S: new Date().toISOString() }
                  }
                };

                await dynamoClient.send(new PutItemCommand(notificationParams));

                logger.info('驗證成功，已更新設定:', {
                  userId,
                  lineId: event.source.userId,
                  timestamp: new Date().toISOString()
                });

                // 發送驗證成功訊息
                await lineServiceInstance.replyMessage(event.replyToken, [{
                  type: 'flex',
                  altText: '驗證成功',
                  contents: {
                    type: 'bubble',
                    body: {
                      type: 'box',
                      layout: 'vertical',
                      contents: [
                        {
                          type: 'text',
                          text: '✅ 驗證成功',
                          weight: 'bold',
                          size: 'xl',
                          color: '#1DB446'
                        },
                        {
                          type: 'text',
                          text: '您已成功開啟 LINE 通知功能！',
                          margin: 'md',
                          size: 'md',
                          color: '#333333'
                        }
                      ]
                    }
                  }
                }]);

                continue;
              } else {
                logger.warn('驗證碼已過期:', {
                  userId,
                  expiryTime: new Date(expiryTime).toISOString(),
                  currentTime: new Date().toISOString()
                });
              }
            } else {
              logger.warn('找不到對應的驗證記錄:', { code: messageText });
            }
          }

          // 如果不是驗證碼，繼續原有的檢查輸入是否為有效的 Cognito User ID 的邏輯
          // 檢查輸入的是否為有效的 Cognito User ID
          const params = {
            TableName: 'AWS_Blog_UserProfiles',
            Key: {
              userId: { S: messageText }
            }
          };

          const command = new GetItemCommand(params);
          const response = await dynamoClient.send(command);

          logger.info('查詢用戶資料:', {
            userId: messageText,
            tableName: 'AWS_Blog_UserProfiles',
            hasRecord: !!response.Item,
            timestamp: new Date().toISOString()
          });

          // 如果找到對應的用戶記錄
          if (response.Item) {
            // 生成驗證碼並儲存到 AWS_Blog_UserNotificationSettings
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

            logger.info('已生成驗證碼:', {
              userId: messageText,
              lineId,
              verificationCode,
              expiryTime: formattedExpiryTime
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
                      text: '🔐 身份驗證',
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
                                      text: '👤 用戶 ID',
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
                                          text: messageText,
                                          size: 'sm',
                                          color: '#333333',
                                          flex: 5,
                                          wrap: true
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
                                          flex: 1
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
                                  text: '1. 前往網站的驗證頁面',
                                  size: 'sm',
                                  color: '#333333'
                                },
                                {
                                  type: 'text',
                                  text: '2. 輸入驗證碼完成綁定',
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
            // 找不到用戶記錄時的回應
            logger.info('找不到用戶記錄，發送自動回覆');
            await lineServiceInstance.replyMessage(event.replyToken, [{
              type: 'text',
              text: '您好，目前此帳號為自動回覆，無法個別回覆用戶的訊息，感謝您的訊息！'
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
    logger.error('Webhook 處理失敗:', {
      error: error instanceof Error ? error.message : '未知錯誤',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
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