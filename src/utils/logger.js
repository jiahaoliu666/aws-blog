const logger = {
  info: (message, ...args) => {
    console.log(`[${new Date().toISOString()}] INFO: ${message}`, ...args);
  },
  error: (message, ...args) => {
    console.error(`[${new Date().toISOString()}] ERROR: ${message}`, ...args);
  },
  warn: (message, ...args) => {
    console.warn(`[${new Date().toISOString()}] WARN: ${message}`, ...args);
  },
};

// 修改導出方式，使用具名導出
exports.logger = logger;
