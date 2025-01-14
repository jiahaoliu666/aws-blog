import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { CognitoIdentityProvider } from '@aws-sdk/client-cognito-identity-provider';
import { SESClient } from "@aws-sdk/client-ses";
export declare const dynamoClient: DynamoDB;
export declare const ddbDocClient: DynamoDBDocument;
export declare const cognitoClient: CognitoIdentityProvider;
export declare const awsConfig: {
    region: string;
    userPoolId: string | undefined;
    userPoolWebClientId: string | undefined;
};
export declare const sesClient: SESClient;
export declare const jsCompatible: {
    dynamoClient: DynamoDB;
    ddbDocClient: DynamoDBDocument;
    cognitoClient: CognitoIdentityProvider;
    awsConfig: {
        region: string;
        userPoolId: string | undefined;
        userPoolWebClientId: string | undefined;
    };
    sesClient: SESClient;
};
