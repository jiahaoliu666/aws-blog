import { DynamoDB } from 'aws-sdk';
import { logger } from '@/utils/logger';

interface DiscordSettings {
  discordId: string;
  discordUsername: string;
  discordDiscriminator: string;
}

export const updateUserDiscordSettings = async (
  userId: string, 
  settings: DiscordSettings
): Promise<boolean> => {
  const dynamodb = new DynamoDB.DocumentClient();
  
  try {
    await dynamodb.update({
      TableName: process.env.USER_TABLE_NAME || 'Users',
      Key: { userId },
      UpdateExpression: 'SET discordId = :did, discordUsername = :dun, discordDiscriminator = :dd, discord = :d',
      ExpressionAttributeValues: {
        ':did': settings.discordId,
        ':dun': settings.discordUsername,
        ':dd': settings.discordDiscriminator,
        ':d': true
      }
    }).promise();
    
    return true;
  } catch (error) {
    logger.error('更新用戶 Discord 設定失敗:', error);
    return false;
  }
}; 