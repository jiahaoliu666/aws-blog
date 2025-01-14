import { logger } from '../utils/logger';
import { DISCORD_ERRORS } from '../config/discord';
export class AppError extends Error {
    constructor(message, statusCode = 500, code) {
        super(message);
        this.message = message;
        this.statusCode = statusCode;
        this.code = code;
        this.name = 'AppError';
        Object.setPrototypeOf(this, AppError.prototype);
    }
}
export class DiscordError extends AppError {
    constructor(message, code) {
        super(message, 400, DISCORD_ERRORS[code]);
        this.name = 'DiscordError';
    }
}
export const errorHandler = {
    handle: (error) => {
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
    handleDiscordError: (error) => {
        logger.error('Discord API 錯誤:', {
            message: error.message,
            status: error.status,
            code: error.code,
            details: error.details,
            stack: error.stack
        });
        if (error.code === 50007) {
            throw new DiscordError('無法發送私人訊息，請確保您的隱私設定允許接收訊息', 'DM_FAILED');
        }
        if (error.status === 401) {
            throw new DiscordError('Discord 授權失敗', 'AUTH_FAILED');
        }
        if (error.status === 404) {
            throw new DiscordError('找不到 Discord 用戶', 'USER_NOT_FOUND');
        }
        if (error.status === 400) {
            throw new DiscordError('Discord 請求無效', 'INVALID_REQUEST');
        }
        throw new DiscordError(error.message || 'Discord 操作失敗', 'INVALID_REQUEST');
    }
};
export class LineError extends Error {
    constructor(message) {
        super(message);
        this.name = 'LineError';
    }
}
export const handleLineError = (error) => {
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
//# sourceMappingURL=errorHandler.js.map