import { LineConfig } from '../types/lineTypes';
export declare const lineConfig: LineConfig;
export declare const validateLineConfig: () => boolean;
export declare const isLineConfigValid: boolean;
export declare const LINE_MESSAGE_MAX_LENGTH = 2000;
export declare const LINE_RETRY_COUNT = 3;
export declare const LINE_RETRY_DELAY = 1000;
export declare const validateLineMessagingConfig: () => void;
export declare const environmentValidation: {
    isValid: boolean;
    missing: string[];
};
