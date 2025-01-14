import { DISCORD_ERRORS } from '../config/discord';
export declare class AppError extends Error {
    message: string;
    statusCode: number;
    code?: string | undefined;
    constructor(message: string, statusCode?: number, code?: string | undefined);
}
export declare class DiscordError extends AppError {
    constructor(message: string, code: keyof typeof DISCORD_ERRORS);
}
export declare const errorHandler: {
    handle: (error: unknown) => {
        success: boolean;
        error: string;
        code: string | undefined;
    };
    handleDiscordError: (error: any) => never;
};
export declare class LineError extends Error {
    constructor(message: string);
}
export declare const handleLineError: (error: any) => "找不到該用戶，請確認 LINE ID 是否正確" | "驗證過程發生錯誤，請稍後再試";
