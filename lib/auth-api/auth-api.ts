import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as apig from "aws-cdk-lib/aws-apigateway";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as node from "aws-cdk-lib/aws-lambda-nodejs";
import { LambdaFn } from "./lambda";

type AuthApiProps = {
    userPoolId: string;
    userPoolClientId: string;
};

export class AuthApi extends Construct {
    constructor(scope: Construct, id: string, props: AuthApiProps) {
        super(scope, id)

        const { userPoolId, userPoolClientId } = props;

        const api = new apig.RestApi(this, "AuthServiceApi", {
            description: "Authentication Service RestApi",
            endpointTypes: [apig.EndpointType.REGIONAL],
            defaultCorsPreflightOptions: {
                allowOrigins: apig.Cors.ALL_ORIGINS,
            },
        });

        const authEndpoint = api.root.addResource("auth");

        const signInFn = new LambdaFn(
            this,
            "signInFn",
            {
                functionName: "signIn",
                fileName: "signIn.ts",
                userPoolId,
                userPoolClientId
            }
        );

        const signUpFn = new LambdaFn(
            this,
            "signUpFn",
            {
                functionName: "signUp",
                fileName: "signUp.ts",
                userPoolId,
                userPoolClientId
            }
        );

        const confirmSignUpFn = new LambdaFn(
            this,
            "confirmSignUpFn",
            {
                functionName: "confirmSignUp",
                fileName: "confirmSignUp.ts",
                userPoolClientId,
                userPoolId
            }
        );

        // URL /auth/signup
        const signUpEndpoint = authEndpoint.addResource("signup");
        // POST /auth/signup
        signUpEndpoint.addMethod(
            "POST",
            new apig.LambdaIntegration(signUpFn.lambdaFunction)
        );

        // URL /auth/confirm-signup
        const confirmSignUpEndpoint = authEndpoint.addResource("confirm-signup");
        // POST /auth/confirm-signup
        confirmSignUpEndpoint.addMethod(
            "POST",
            new apig.LambdaIntegration(confirmSignUpFn.lambdaFunction)
        );

        // URL /auth/signin
        const signInEndpoint = authEndpoint.addResource("signin");
        // POST /auth/signin
        signInEndpoint.addMethod(
            "POST",
            new apig.LambdaIntegration(signInFn.lambdaFunction)
        );
    }
}