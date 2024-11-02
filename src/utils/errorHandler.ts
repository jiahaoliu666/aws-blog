import { logger } from '@/utils/logger';

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const errorHandler = {
  handle: (error: unknown) => {
    if (error instanceof AppError) {
      logger.error(`[${error.code}] ${error.message}`);
      return {
        success: false,
        error: error.message,
        code: error.code,
      };
    }

    const errorMessage = error instanceof Error ? error.message : '發生未預期的錯誤';
    logger.error('未預期的錯誤:', errorMessage);
    return {
      success: false,
      error: errorMessage,
      code: 'UNKNOWN_ERROR',
    };
  },
}; 