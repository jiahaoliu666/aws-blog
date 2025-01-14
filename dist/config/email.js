// 新增此文件以集中管理郵件相關配置
export const emailConfig = {
    senderEmail: process.env.NEXT_PUBLIC_SES_SENDER_EMAIL,
    region: process.env.AWS_REGION || 'ap-northeast-1',
    // 驗證配置
    validateConfig: () => {
        if (!process.env.NEXT_PUBLIC_SES_SENDER_EMAIL) {
            throw new Error('未設置發件人郵箱');
        }
        if (!process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID ||
            !process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY) {
            throw new Error('未設置 AWS 憑證');
        }
    }
};
export const validateEmailConfig = () => {
    const requiredVars = [
        'NEXT_PUBLIC_AWS_ACCESS_KEY_ID',
        'NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY',
        'NEXT_PUBLIC_SES_SENDER_EMAIL',
    ];
    for (const varName of requiredVars) {
        if (!process.env[varName]) {
            throw new Error(`Missing required environment variable: ${varName}`);
        }
    }
};
//# sourceMappingURL=email.js.map