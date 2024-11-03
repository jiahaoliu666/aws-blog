// services/lineService.ts
import { Client, WebhookEvent } from '@line/bot-sdk';
import { lineConfig } from '@/config/line';

const client = new Client(lineConfig);

export const handleLineEvent = async (event: WebhookEvent) => {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }

  const userMessage = event.message.text;

  if (userMessage.toLowerCase() === 'today news') {
    const newsList = await fetchTodayNews();
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: `今天的新文章有: ${newsList.join(', ')}`,
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

async function fetchTodayNews(): Promise<string[]> {
  return ['新聞1', '新聞2', '新聞3'];
}