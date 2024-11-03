// pages/api/line/webhook.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { middleware } from '@line/bot-sdk';
import { handleLineEvent } from '../../../services/lineService';
import { lineConfig } from '../../../config/line';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      await Promise.all(req.body.events.map(handleLineEvent));
      res.status(200).end();
    } catch (error) {
      console.error(error);
      res.status(500).end();
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
  middleware: middleware(lineConfig),
};