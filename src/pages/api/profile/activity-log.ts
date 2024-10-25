// pages/api/profile/activity-log.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';

const dynamoClient = new DynamoDBClient({ region: 'ap-northeast-1' });

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'POST') {
    const { userId, action } = req.body; // 移除 details

    // 移除獲取用戶 IP 地址的代碼
    // const forwardedFor = req.headers['x-forwarded-for'];
    // const ip = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor?.split(',')[0] || req.connection.remoteAddress;

    // 格式化日期
    const formatDate = (date: Date) => {
      return date.toLocaleString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      }).replace(/\//g, '-');
    };

    const timestamp = formatDate(new Date());

    const params = {
      TableName: 'AWS_Blog_UserActivityLog',
      Item: {
        userId: { S: userId },
        timestamp: { S: timestamp },
        action: { S: action },
        // 移除 details
      },
    };

    try {
      const command = new PutItemCommand(params);
      await dynamoClient.send(command);
      res.status(200).json({ message: 'Activity log saved successfully' });
    } catch (error) {
      console.error('Error saving activity log:', error);
      res.status(500).json({ error: 'Error saving activity log' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
};
