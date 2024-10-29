// pages/api/profile/activity-log.ts

import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';

const logActivity = async (userId: string, action: string) => {
  try {
    const dynamoClient = new DynamoDBClient({
      region: 'ap-northeast-1',
      credentials: {
        accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY!,
      },
    });

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

    const putParams = {
      TableName: 'AWS_Blog_UserActivityLog',
      Item: {
        userId: { S: userId },
        timestamp: { S: timestamp },
        action: { S: action },
      },
    };
    const putCommand = new PutItemCommand(putParams);
    await dynamoClient.send(putCommand);
    console.log(`Activity logged: ${action} at ${timestamp}`);
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};

export default logActivity;
