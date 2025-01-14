import NodeCache from 'node-cache';
export declare const verificationCache: NodeCache;
export declare const lineStatusCache: NodeCache;
export declare const invalidateCache: (userId: string) => Promise<void>;
export declare const handleSettingsUpdate: (userId: string, newSettings: any) => Promise<void>;
