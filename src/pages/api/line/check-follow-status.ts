import { NextApiRequest, NextApiResponse } from 'next';
import { checkLineFollowStatus } from '@/services/lineService';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { lineId } = req.body;
    const isFollowing = await checkLineFollowStatus(lineId);
    res.status(200).json({ isFollowing });
  } catch (error) {
    console.error('LINE API 錯誤:', error);
    res.status(500).json({ error: '檢查追蹤狀態時發生錯誤' });
  }
} 