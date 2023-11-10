import * as cdk from 'aws-cdk-lib';
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import { Construct } from 'constructs';
import { SeedData } from './seed-data';
import { reviews } from '../seed/reviews';
import { RestApi } from './rest-api';


export class RestApiStack extends cdk.Stack {
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
      sortKey: {name: "reviewDate", type: dynamodb.AttributeType.STRING}
    });

    new SeedData(this, "SeedData", { reviewsTable, reviews });

   const restApi = new RestApi(this, "RestAPI", {
    table: reviewsTable
   });

  }
}
