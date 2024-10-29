// pages/api/profile/activity-log.ts

import { DynamoDBClient, PutItemCommand, QueryCommand, DeleteItemCommand } from '@aws-sdk/client-dynamodb';

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

    // Fetch all activities to check the count
    const queryParams = {
      TableName: 'AWS_Blog_UserActivityLog',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': { S: userId },
      },
      ScanIndexForward: true, // Ascending order to get the oldest first
    };
    const queryCommand = new QueryCommand(queryParams);
    const response = await dynamoClient.send(queryCommand);

    if (response.Items && response.Items.length > 12) {
      // Delete the oldest activity
      const oldestActivity = response.Items[0];
      if (oldestActivity.timestamp.S) {
        const deleteParams = {
          TableName: 'AWS_Blog_UserActivityLog',
          Key: {
            userId: { S: userId },
            timestamp: { S: oldestActivity.timestamp.S },
          },
        };
        const deleteCommand = new DeleteItemCommand(deleteParams);
        await dynamoClient.send(deleteCommand);
        console.log(`Oldest activity deleted with timestamp: ${oldestActivity.timestamp.S}`);
      } else {
        console.error('Error: timestamp is undefined');
      }
    }
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};

export default logActivity;
