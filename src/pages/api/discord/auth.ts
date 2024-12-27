import { NextApiRequest, NextApiResponse } from 'next';
import { DISCORD_CONFIG } from '@/config/discord';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: '方法不允許' });
  }

  const scope = [
    'identify',
    'email',
    'guilds.join',
    'webhook.incoming'
  ].join(' ');
  
  const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${
    DISCORD_CONFIG.CLIENT_ID
  }&redirect_uri=${encodeURIComponent(
    DISCORD_CONFIG.REDIRECT_URI
  )}&response_type=code&scope=${scope}&permissions=8`;

  return res.status(200).json({ authUrl });
} 