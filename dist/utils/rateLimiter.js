export default class RateLimiter {
    constructor(maxRequests = 5, timeWindowSeconds = 60, rate = 1000) {
        this.requests = new Map();
        this.maxRequests = maxRequests;
        this.timeWindow = timeWindowSeconds * 1000;
        this.queue = Promise.resolve();
        this.rate = rate;
        this.tokens = rate;
        this.lastRefill = Date.now();
    }
    async check(req, res) {
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
        const now = Date.now();
        let requests = this.requests.get(ip) || [];
        requests = requests.filter(time => now - time < this.timeWindow);
        if (requests.length >= this.maxRequests) {
            return false;
        }
        requests.push(now);
        this.requests.set(ip, requests);
        return true;
    }
    async acquire() {
        await this.refill();
        if (this.tokens <= 0) {
            throw new Error('超過速率限制');
        }
        this.tokens--;
    }
    async refill() {
        const now = Date.now();
        const timePassed = now - this.lastRefill;
        const newTokens = Math.floor(timePassed * (this.rate / 1000));
        if (newTokens > 0) {
            this.tokens = Math.min(this.rate, this.tokens + newTokens);
            this.lastRefill = now;
        }
    }
}
//# sourceMappingURL=rateLimiter.js.map