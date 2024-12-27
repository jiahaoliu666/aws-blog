import { logger } from '@/utils/logger';
import { DISCORD_ERRORS } from '@/config/discord';

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

export class DiscordError extends AppError {
  constructor(message: string, code: keyof typeof DISCORD_ERRORS) {
    super(message, 400, DISCORD_ERRORS[code]);
    this.name = 'DiscordError';
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

    if (error instanceof DiscordError) {
      logger.error(`[Discord Error] ${error.message}`);
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

  handleDiscordError: (error: any) => {
    logger.error('Discord API 錯誤:', {
      message: error.message,
      status: error.status,
      details: error.details
    });

    if (error.status === 401) {
      throw new DiscordError('Discord 授權失敗', 'AUTH_FAILED');
    }

    if (error.status === 404) {
      throw new DiscordError('找不到 Discord 用戶', 'USER_NOT_FOUND');
    }

    throw new DiscordError('Discord 操作失敗', 'WEBHOOK_FAILED');
  }
};

export class LineError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LineError';
  }
}

export const handleLineError = (error: any) => {
  logger.error('LINE API 錯誤:', {
    message: error.message,
    status: error.status,
    details: error.details
  });
  
  if (error.status === 404) {
    return '找不到該用戶，請確認 LINE ID 是否正確';
  }
  
  return '驗證過程發生錯誤，請稍後再試';
}; 