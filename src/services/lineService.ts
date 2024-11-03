// services/lineService.ts
import { Client, middleware, WebhookEvent } from '@line/bot-sdk';
import { lineConfig } from '@/config/line';

const client = new Client(lineConfig);

export const handleLineEvent = async (event: WebhookEvent) => {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }

  const userMessage = event.message.text;

  if (userMessage.toLowerCase() === 'today news') {
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: '這是今天的新文章列表...',
    });
  }

  return client.replyMessage(event.replyToken, {
    type: 'text',
    text: `您說了: ${userMessage}`,
  });
};

export const pushNewArticleNotification = async (userId: string, articleTitle: string) => {
  return client.pushMessage(userId, {
    type: 'text',
    text: `新文章發布: ${articleTitle}`,
  });
};