// src/utils/cognitoClient.ts  
import { CognitoIdentityProviderClient } from "@aws-sdk/client-cognito-identity-provider";  

const cognitoClient = new CognitoIdentityProviderClient({  
  region: "ap-northeast-1",  
});  

export default cognitoClient;