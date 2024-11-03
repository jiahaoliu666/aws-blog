import crypto from 'crypto';
import { NextApiRequest } from 'next';
import { lineConfig } from '@/config/line';

export function verifyLineSignature(req: NextApiRequest): boolean {
  try {
    const signature = req.headers['x-line-signature'] as string;
    if (!signature) {
      return false;
    }

    const body = JSON.stringify(req.body);
    const hash = crypto
      .createHmac('SHA256', lineConfig.channelSecret)
      .update(body)
      .digest('base64');

    return hash === signature;
  } catch (error) {
    return false;
  }
} 