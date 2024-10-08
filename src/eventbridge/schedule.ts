import { EventBridgeClient } from '@aws-sdk/client-eventbridge';  
import { PutRuleCommand } from '@aws-sdk/client-eventbridge';  
import { PutTargetsCommand } from '@aws-sdk/client-eventbridge';  
import { LambdaClient } from '@aws-sdk/client-lambda';  
import { AddPermissionCommand } from '@aws-sdk/client-lambda';  

const eventBridgeClient = new EventBridgeClient({ region: 'ap-northeast-1' });  
const lambdaClient = new LambdaClient({ region: 'ap-northeast-1' });  

const ruleName = 'HourlyLambdaInvocation';  
const lambdaFunctionName = 'YOUR_LAMBDA_FUNCTION_NAME'; // 填入您的 Lambda 函數名稱  

async function createEventBridgeRule() {  
    try {  
        // 創建每小時的規則  
        const ruleCommand = new PutRuleCommand({  
            Name: ruleName,  
            ScheduleExpression: 'rate(1 hour)',  
            State: 'ENABLED',  
        });  

        const ruleResponse = await eventBridgeClient.send(ruleCommand);  
        console.log('Successfully created rule:', ruleResponse);  

        // 設定 Lambda 函數作為目標  
        const targetsCommand = new PutTargetsCommand({  
            Rule: ruleName,  
            Targets: [  
                {  
                    Id: 'TargetId',  
                    Arn: `arn:aws:lambda:ap-northeast-1:YOUR_ACCOUNT_ID:function:${lambdaFunctionName}`,  
                },  
            ],  
        });  

        const targetsResponse = await eventBridgeClient.send(targetsCommand);  
        console.log('Successfully added target:', targetsResponse);  

        // 給 EventBridge 允許 Lambda 函數被調用  
        const permissionCommand = new AddPermissionCommand({  
            Action: 'lambda:InvokeFunction',  
            FunctionName: lambdaFunctionName,  
            Principal: 'events.amazonaws.com',  
            SourceArn: `arn:aws:events:ap-northeast-1:YOUR_ACCOUNT_ID:rule/${ruleName}`,  
            StatementId: `Id-${new Date().getTime()}`,  
        });  

        const permissionResponse = await lambdaClient.send(permissionCommand);  
        console.log('Permission added to Lambda function:', permissionResponse);  
    } catch (error) {  
        console.error('Error creating EventBridge rule or targets:', error);  
    }  
}  

// 呼叫函數以設定 EventBridge  
createEventBridgeRule();