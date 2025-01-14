let cachedCredentials = null;
export async function getAWSCredentials() {
    try {
        // 檢查是否在 Amplify 環境中
        const isAmplifyEnv = process.env.AWS_CONTAINER_CREDENTIALS_RELATIVE_URI ||
            process.env.AWS_EXECUTION_ENV?.includes('AWS_Amplify');
        if (isAmplifyEnv) {
            console.log('Running in Amplify environment');
            return undefined; // 使用 IAM 角色
        }
        // 在其他環境中
        console.log('Using default credential provider chain');
        return undefined; // 讓 AWS SDK 自動處理憑證
    }
    catch (error) {
        console.warn('Warning: AWS credentials not explicitly set, using default credential provider chain');
        return undefined;
    }
}
//# sourceMappingURL=awsConfig.js.map