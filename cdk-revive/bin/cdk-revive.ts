#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { CdkReviveStack } from '../lib/cdk-revive-stack';

const app = new cdk.App();
new CdkReviveStack(app, 'CdkReviveStack', {
  env: {
    region: process.env.CDK_DEFAULT_REGION,
  },
});
