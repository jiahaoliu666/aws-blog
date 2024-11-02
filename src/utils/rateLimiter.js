class RateLimiter {
  constructor(rateLimit) {
    this.queue = [];
    this.rateLimit = rateLimit;
  }

  async acquire() {
    const now = Date.now();
    this.queue = this.queue.filter((time) => now - time < 1000);

    if (this.queue.length >= this.rateLimit) {
      const delay = 1000 - (now - this.queue[0]);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return this.acquire();
    }

    this.queue.push(now);
  }
}

module.exports = RateLimiter;
