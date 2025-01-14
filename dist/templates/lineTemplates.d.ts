import { ArticleData, LineMessage } from '../types/lineTypes';
export declare const createNewsNotificationTemplate: (articleData: ArticleData) => LineMessage;
export declare const createWelcomeTemplate: () => {
    type: string;
    altText: string;
    contents: {
        type: string;
        body: {
            type: string;
            layout: string;
            contents: ({
                type: string;
                text: string;
                weight: string;
                size: string;
                color: string;
                margin?: undefined;
                wrap?: undefined;
            } | {
                type: string;
                text: string;
                margin: string;
                size: string;
                color: string;
                weight?: undefined;
                wrap?: undefined;
            } | {
                type: string;
                text: string;
                margin: string;
                size: string;
                weight?: undefined;
                color?: undefined;
                wrap?: undefined;
            } | {
                type: string;
                text: string;
                margin: string;
                size: string;
                color: string;
                wrap: boolean;
                weight?: undefined;
            })[];
        };
    };
};
export declare const generateArticleTemplate: (articleData: ArticleData) => LineMessage;
export declare const createVerificationSuccessTemplate: () => {
    type: string;
    altText: string;
    contents: {
        type: string;
        body: {
            type: string;
            layout: string;
            contents: ({
                type: string;
                text: string;
                weight: string;
                size: string;
                color: string;
                margin?: undefined;
            } | {
                type: string;
                text: string;
                margin: string;
                size: string;
                weight?: undefined;
                color?: undefined;
            })[];
        };
    };
};
export declare const createUserIdTemplate: (userId: string) => {
    type: string;
    altText: string;
    contents: {
        type: string;
        body: {
            type: string;
            layout: string;
            contents: ({
                type: string;
                text: string;
                weight: string;
                size: string;
                margin?: undefined;
                wrap?: undefined;
            } | {
                type: string;
                text: string;
                margin: string;
                wrap: boolean;
                weight?: undefined;
                size?: undefined;
            })[];
        };
    };
};
export declare const createVerificationTemplate: (userId: string, verificationCode: string) => {
    type: string;
    altText: string;
    contents: {
        type: string;
        body: {
            type: string;
            layout: string;
            contents: ({
                type: string;
                text: string;
                weight: string;
                size: string;
                margin?: undefined;
                wrap?: undefined;
            } | {
                type: string;
                text: string;
                margin: string;
                size: string;
                wrap: boolean;
                weight?: undefined;
            } | {
                type: string;
                text: string;
                weight: string;
                size: string;
                margin: string;
                wrap?: undefined;
            })[];
        };
    };
};
