import { Amplify } from 'aws-amplify';
export function configureAmplify() {
    Amplify.configure({
        Auth: {
            Cognito: {
                userPoolId: process.env.NEXT_PUBLIC_USER_POOL_ID || '',
                userPoolClientId: process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID || '',
                signUpVerificationMethod: 'code',
                loginWith: {
                    email: true,
                    phone: false,
                    username: false
                }
            }
        },
        Storage: {
            S3: {
                bucket: process.env.NEXT_PUBLIC_S3_BUCKET || '',
                region: process.env.NEXT_PUBLIC_AWS_REGION || 'ap-northeast-1'
            }
        }
    });
}
//# sourceMappingURL=amplify-config.js.map