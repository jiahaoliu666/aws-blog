import { logger } from '@/utils/logger';

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const errorHandler = {
  handle: (error: any) => {
    if (error instanceof AppError) {
      logger.error(`[${error.code}] ${error.message}`);
      return {
        success: false,
        error: error.message,
        code: error.code,
      };
    }

    logger.error('未預期的錯誤:', error);
    return {
      success: false,
      error: '發生未預期的錯誤',
      code: 'UNKNOWN_ERROR',
    };
  },
}; 