// pages/api/profile/activity-log.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { DynamoDBClient, PutItemCommand, QueryCommand, DeleteItemCommand } from '@aws-sdk/client-dynamodb';

const dynamoClient = new DynamoDBClient({ region: 'ap-northeast-1' });

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'POST') {
    const { userId, action } = req.body;

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
      },
    };

    try {
      const command = new PutItemCommand(params);
      await dynamoClient.send(command);

      // 確保只保留12筆記錄
      const queryParams = {
        TableName: 'AWS_Blog_UserActivityLog',
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': { S: userId },
        },
        ScanIndexForward: true,
      };

      const queryCommand = new QueryCommand(queryParams);
      const queryResponse = await dynamoClient.send(queryCommand);
      console.log('Current activity log count:', queryResponse.Items?.length); // 添加日誌輸出

      if (queryResponse.Items && queryResponse.Items.length > 12) {
        const itemsToDelete = queryResponse.Items.slice(0, queryResponse.Items.length - 12);
        for (const item of itemsToDelete) {
          const deleteParams = {
            TableName: 'AWS_Blog_UserActivityLog',
            Key: {
              userId: { S: userId },
              timestamp: { S: item.timestamp.S || '' },
            },
          };
          const deleteCommand = new DeleteItemCommand(deleteParams);
          await dynamoClient.send(deleteCommand);
        }
      }

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
