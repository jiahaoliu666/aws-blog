import { NextApiRequest, NextApiResponse } from 'next';
import { Client } from '@line/bot-sdk';
import { lineConfig } from '@/config/line';
import { logger } from '@/utils/logger';

const client = new Client({
  channelAccessToken: lineConfig.channelAccessToken,
  channelSecret: lineConfig.channelSecret,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  const { lineId, message } = req.body;

  if (!lineId || !message) {
    return res.status(400).json({ error: '缺少必要參數' });
  }

  try {
    await client.pushMessage(lineId, {
      type: 'text',
      text: message
    });

    res.status(200).json({ success: true });
  } catch (error) {
    logger.error('發送 LINE 訊息失敗:', error);
    res.status(500).json({ error: '發送訊息失敗' });
  }
} 