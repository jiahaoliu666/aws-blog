import type { NextApiResponse, NextApiRequest } from 'next/types';

export default class RateLimiter {
    private queue: Promise<void>;
    private requests: Map<string, number[]>;
    private maxRequests: number;
    private timeWindow: number;
    private tokens: number;
    private lastRefill: number;
    private readonly rate: number;
  
    constructor(maxRequests: number = 5, timeWindowSeconds: number = 60, rate: number = 1000) {
      this.requests = new Map();
      this.maxRequests = maxRequests;
      this.timeWindow = timeWindowSeconds * 1000;
      this.queue = Promise.resolve();
      this.rate = rate;
      this.tokens = rate;
      this.lastRefill = Date.now();
    }
  
    async check(req: NextApiRequest, res: NextApiResponse): Promise<boolean> {
      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
      const now = Date.now();
      
      let requests = this.requests.get(ip as string) || [];
      requests = requests.filter(time => now - time < this.timeWindow);
      
      if (requests.length >= this.maxRequests) {
        return false;
      }
      
      requests.push(now);
      this.requests.set(ip as string, requests);
      return true;
    }

    async acquire(): Promise<void> {
      await this.refill();
      if (this.tokens <= 0) {
        throw new Error('超過速率限制');
      }
      this.tokens--;
    }

    private async refill(): Promise<void> {
      const now = Date.now();
      const timePassed = now - this.lastRefill;
      const newTokens = Math.floor(timePassed * (this.rate / 1000));
      
      if (newTokens > 0) {
        this.tokens = Math.min(this.rate, this.tokens + newTokens);
        this.lastRefill = now;
      }
    }
}