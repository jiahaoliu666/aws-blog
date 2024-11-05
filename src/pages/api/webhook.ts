// import { NextApiRequest, NextApiResponse } from 'next';
// import { lineConfig } from '../../config/line';
// import * as crypto from 'crypto';
// import { verifyLineSignature } from '../../utils/lineUtils';
// import { logger } from '../../utils/logger';
// import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';

// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
//   if (req.method !== 'POST') {
//     return res.status(405).json({ message: 'Method not allowed' });
//   }

//   // 驗證 Line 簽名
//   if (!verifyLineSignature(req)) {
//     return res.status(401).json({ message: 'Invalid signature' });
//   }

//   try {
//     const events = req.body.events;
//     for (const event of events) {
//       if (event.type === 'follow') {
//         // 處理新的追蹤者
//         await handleNewFollower(event.source.userId);
//       }
//     }

//     res.status(200).json({ message: 'OK' });
//   } catch (error) {
//     logger.error('Webhook 處理錯誤:', error);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// }

// async function handleNewFollower(lineUserId: string) {
//   const dynamoClient = new DynamoDBClient({ region: "ap-northeast-1" });
  
//   try {
//     // 更新或創建用戶的通知設置
//     const params = {
//       TableName: "AWS_Blog_UserNotificationSettings",
//       Item: {
//         lineUserId: { S: lineUserId },
//         lineNotification: { BOOL: true },
//         updatedAt: { S: new Date().toISOString() }
//       }
//     };

//     await dynamoClient.send(new PutItemCommand(params));
//     logger.info(`新的 Line 用戶已綁定: ${lineUserId}`);
//   } catch (error) {
//     logger.error('處理新的 Line 追蹤者時發生錯誤:', error);
//   }
// } 