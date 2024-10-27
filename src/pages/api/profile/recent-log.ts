// pages/api/profile/recent-log.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';

const dynamoClient = new DynamoDBClient({ region: 'ap-northeast-1' });

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'POST') {
    const { userId, articleId, link, sourcePage } = req.body;

    if (!userId || !articleId || !link || !sourcePage) {
      return res.status(400).json({ error: 'Missing required fields in request body' });
    }

    const timestamp = new Date().toISOString();

    const params = {
      TableName: 'AWS_Blog_UserRecentArticles',
      Item: {
        userId: { S: userId },
        articleId: { S: articleId },
        timestamp: { S: timestamp },
        link: { S: link },
        sourcePage: { S: sourcePage },
      },
    };

    try {
      const command = new PutItemCommand(params);
      await dynamoClient.send(command);
      console.log(`Recent article saved: ${articleId} for user: ${userId} at ${timestamp}`);
      res.status(200).json({ message: 'Recent article saved successfully' });
    } catch (error) {
      console.error('Error saving recent article:', error);
      res.status(500).json({ error: 'Error saving recent article' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
};
