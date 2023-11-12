import { Construct } from "constructs";
import { LambdaFn } from "./lambda";
import * as apig from "aws-cdk-lib/aws-apigateway";
import * as cdk from "aws-cdk-lib";

type RequestAuthorizerProps = {
    userPoolId: string,
    userPoolClientId: string
}

export class RequestAuthorizer extends Construct {
    public requestAuthorizer: apig.RequestAuthorizer;

    constructor(scope: Construct, id: string, props: RequestAuthorizerProps) {
        super(scope, id);

        const { userPoolClientId, userPoolId } = props;

        const authorizerFn = new LambdaFn(
            this,
            "authorizerFn",
            {
                functionName: "authorizer",
                fileName: "authorizer.ts",
                userPoolId,
                userPoolClientId
            }
        );

        this.requestAuthorizer = new apig.RequestAuthorizer(
            this,
            "RequestAuthorizer",
            {
              identitySources: [apig.IdentitySource.header("cookie")],
              handler: authorizerFn.lambdaFunction,
              resultsCacheTtl: cdk.Duration.minutes(0),
            }
          );
    }
}