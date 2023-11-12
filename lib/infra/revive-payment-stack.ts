import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as path from 'path';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';

export class RevivePaymentStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);


    const lambdaFn = new lambdaNodejs.NodejsFunction(this, 'MyLambdaFunction', {
      entry: path.join(__dirname, 'lambda-handler.ts'),
      handler: 'handler',
      environment: {
        GOOGLE_SHEETS_API_KEY_SECRET_NAME: 'my-google-sheets-api-key-secret',
        GOOGLE_SHEETS_SPREADSHEET_ID: 'my-google-sheets-spreadsheet-id',
      },
    });
    
    
    // Grant permissions to access the Google Sheets API
    // TODO: create the secret in the console. 
const secret = secretsmanager.Secret.fromSecretNameV2(this, 'MyGoogleSheetsApiKeySecret', 'my-google-sheets-api-key-secret');
const apiKey = secret.secretValueFromJson('api_key');
lambdaFn.addToRolePolicy(new iam.PolicyStatement({
  actions: ['secretsmanager:GetSecretValue'],
  resources: [secret.secretArn],
}));
lambdaFn.addToRolePolicy(new iam.PolicyStatement({
  actions: ['sheets.spreadsheets.values.update'],
  resources: [`arn:aws:sheets:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:spreadsheet/${process.env.GOOGLE_SHEETS_SPREADSHEET_ID}`],
  conditions: {
    StringEquals: {
      'aws:PrincipalType': 'Service',
      'aws:PrincipalService': 'lambda.amazonaws.com',
    },
  },
}));
    
    
const rule = new events.Rule(this, 'MyCloudWatchEventRule', {
  schedule: events.Schedule.cron({
    minute: '0',
    hour: '8',
  }),
});

rule.addTarget(new targets.LambdaFunction(lambdaFn));

    rule.addTarget(new targets.LambdaFunction(lambdaFn));
    
    
    const policy = new iam.Policy(this, 'MyLambdaFunctionPolicy', {
  statements: [
    new iam.PolicyStatement({
      actions: ['secretsmanager:GetSecretValue'],
      resources: [secret.secretArn],
    }),
    new iam.PolicyStatement({
      actions: ['sheets.spreadsheets.values.update'],
      // TODO create a GOOGLE_SHEETS_SPREADSHEET_ID env variable
      resources: [`arn:aws:sheets:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:spreadsheet/${process.env.GOOGLE_SHEETS_SPREADSHEET_ID}`],
      conditions: {
        StringEquals: {
          'aws:PrincipalType': 'Service',
          'aws:PrincipalService': 'lambda.amazonaws.com',
        },
      },
    }),
  ],
});

policy.attachToRole(lambdaFn.role!);
  }
  
}