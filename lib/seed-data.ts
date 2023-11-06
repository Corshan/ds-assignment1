import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { Review } from "../shared/types";
import * as custom from "aws-cdk-lib/custom-resources";
import { Table } from "aws-cdk-lib/aws-dynamodb";
import { generateBatch } from "../shared/utils"

type SeedDataProps = {
    reviewsTable: Table,
    reviews: Review[]
}

export class SeedData extends Construct {
    constructor(scope: Construct, id: string, props: SeedDataProps) {
        super(scope, id)

        const resName = "reviewsdbInitData"
        const { reviewsTable, reviews } = props;

        new custom.AwsCustomResource(this, resName, {
            onCreate: {
                service: "DynamoDB",
                action: "batchWriteItem",
                parameters: {
                    RequestItems: {
                        [reviewsTable.tableName]: generateBatch(reviews),
                    },
                },
                physicalResourceId: custom.PhysicalResourceId.of(resName), //.of(Date.now().toString()),
            },
            policy: custom.AwsCustomResourcePolicy.fromSdkCalls({
                resources: [reviewsTable.tableArn], 
            }),
        });
    }
}