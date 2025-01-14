import type { NextApiResponse, NextApiRequest } from 'next/types';
export default class RateLimiter {
    private queue;
    private requests;
    private maxRequests;
    private timeWindow;
    private tokens;
    private lastRefill;
    private readonly rate;
    constructor(maxRequests?: number, timeWindowSeconds?: number, rate?: number);
    check(req: NextApiRequest, res: NextApiResponse): Promise<boolean>;
    acquire(): Promise<void>;
    private refill;
}
