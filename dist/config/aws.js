import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { CognitoIdentityProvider } from '@aws-sdk/client-cognito-identity-provider';
import { SESClient } from "@aws-sdk/client-ses";
export const dynamoClient = new DynamoDB({
    region: process.env.AWS_REGION || 'ap-northeast-1'
});
export const ddbDocClient = DynamoDBDocument.from(dynamoClient);
export const cognitoClient = new CognitoIdentityProvider({
    region: process.env.AWS_REGION || 'ap-northeast-1'
});
export const awsConfig = {
    region: process.env.AWS_REGION || 'ap-northeast-1',
    userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID,
    userPoolWebClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID,
};
export const sesClient = new SESClient({
    region: process.env.AWS_REGION || 'ap-northeast-1'
});
export const jsCompatible = {
    dynamoClient,
    ddbDocClient,
    cognitoClient,
    awsConfig,
    sesClient
};
//# sourceMappingURL=aws.js.map