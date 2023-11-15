import { Duration, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { config } from 'dotenv';
import {
  NodejsFunction,
  NodejsFunctionProps,
} from 'aws-cdk-lib/aws-lambda-nodejs';

export class CdkReviveStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const configOutput = config();
    if (configOutput.error) {
      console.log('ERROR LOADING CONFIG');
    }

    const paymentsFunction = new NodejsFunction(this, 'CdkReviveFunction', {
      // change the name of the function here
      functionName: 'revive-payments',
      runtime: Runtime.NODEJS_18_X,
      memorySize: 128,
      timeout: Duration.seconds(60),
      entry: 'src/functions/payments.ts',
      environment: {
        // add environment variables here
        GOOGLE_SERVICE_ACCOUNT_EMAIL: configOutput?.parsed
          ?.GOOGLE_SERVICE_ACCOUNT_EMAIL as string,
        GOOGLE_PRIVATE_KEY: configOutput?.parsed?.GOOGLE_PRIVATE_KEY as string,
        GOOGLE_SPREADSHEET_ID: configOutput?.parsed
          ?.GOOGLE_SPREADSHEET_ID as string,
        PAYKU_TOKEN: configOutput?.parsed?.PAYKU_TOKEN as string,
      },
    });
  }
}
