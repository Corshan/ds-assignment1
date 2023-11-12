import * as cdk from 'aws-cdk-lib';
import { UserPool } from "aws-cdk-lib/aws-cognito";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import { Construct } from 'constructs';
import { SeedData } from './rest-api/seed-data';
import { reviews } from '../seed/reviews';
import { RestApi } from './rest-api/rest-api';
import { AuthApi } from './auth-api/auth-api';


export class AppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const reviewsTable = new dynamodb.Table(this, "ReviewsTable", {
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      partitionKey: { name: "movieId", type: dynamodb.AttributeType.NUMBER },
      sortKey: { name: "reviewerName", type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      tableName: "Reviews"
    });

    reviewsTable.addLocalSecondaryIndex({
      indexName: "date",
      sortKey: { name: "reviewDate", type: dynamodb.AttributeType.STRING }
    });

    const userPool = new UserPool(this, "UserPool", {
      signInAliases: { username: true, email: true },
      selfSignUpEnabled: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    const appClient = userPool.addClient("AppClient", {
      authFlows: { userPassword: true }
    });

    new SeedData(this, "SeedData", { reviewsTable, reviews });

    const authApi = new AuthApi(this, "AuthAPI", {
      userPoolClientId: appClient.userPoolClientId,
      userPoolId: userPool.userPoolId
    });

    const restApi = new RestApi(this, "RestAPI", {
      table: reviewsTable,
      requestAuthorizer: authApi.requestAuthorizer
    }); 
  }
}
