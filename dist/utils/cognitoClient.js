// src/utils/cognitoClient.ts  
import { CognitoIdentityProviderClient } from "@aws-sdk/client-cognito-identity-provider";
const cognitoClient = new CognitoIdentityProviderClient({
    region: process.env.NEXT_PUBLIC_AWS_REGION || "ap-northeast-1",
    credentials: {
        accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY || ''
    }
});
export default cognitoClient;
//# sourceMappingURL=cognitoClient.js.map