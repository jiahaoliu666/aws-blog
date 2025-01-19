export const logger = {
  info: (message: string, ...args: any[]) => {
    console.log(message, ...args);
  },
  debug: (message: string, ...args: any[]) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(message, ...args);
    }
  },
  error: (message: string, ...args: any[]) => {
    console.error(message, ...args);
  },
  warn: (message: string, ...args: any[]) => {
    console.warn(message, ...args);
  }
}; 