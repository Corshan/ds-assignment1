import * as lambda from "aws-cdk-lib/aws-lambda";
import * as cdk from "aws-cdk-lib";
import * as lambdanode from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";

type LambdaProps = {
    functionName: string,
    fileName: string,
    userPoolId: string,
    userPoolClientId: string,

}

export class LambdaFn extends Construct {
    public lambdaFunction: cdk.aws_lambda_nodejs.NodejsFunction;

    constructor(scope: Construct, id: string, props: LambdaProps) {
        super(scope, id);

        const { functionName, fileName, userPoolId, userPoolClientId } = props;

        this.lambdaFunction = new lambdanode.NodejsFunction(
            scope,
            functionName,
            {
                architecture: lambda.Architecture.ARM_64,
                runtime: lambda.Runtime.NODEJS_16_X,
                entry: `${__dirname}/../../lambdas/auth/${fileName}`,
                timeout: cdk.Duration.seconds(10),
                memorySize: 128,
                environment: {
                    USER_POOL_ID: userPoolId,
                    CLIENT_ID: userPoolClientId,
                    REGION: 'eu-west-1',
                },
            }
        );
    }
}