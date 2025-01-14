export declare function withRetry<T>(operation: () => Promise<T>, options?: {
    retryCount: number;
    retryDelay: number;
    operationName: string;
}): Promise<T>;
