import * as lambda from "aws-cdk-lib/aws-lambda";
import * as cdk from "aws-cdk-lib";
import * as lambdanode from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import { Table } from "aws-cdk-lib/aws-dynamodb";
import { Permissons } from "../shared/utils";

type LambdaProps = {
  functionName: string,
  fileName: string,
  table: Table,
  permissons: Permissons,
}

export class LambdaFn extends Construct {
  public lambdaFunction: cdk.aws_lambda_nodejs.NodejsFunction;

  constructor(scope: Construct, id: string, props: LambdaProps) {
    super(scope, id);

    const { functionName, fileName, table, permissons } = props;

    this.lambdaFunction = new lambdanode.NodejsFunction(
      scope,
      functionName,
      {
        architecture: lambda.Architecture.ARM_64,
        runtime: lambda.Runtime.NODEJS_16_X,
        entry: `${__dirname}/../lambdas/${fileName}`,
        timeout: cdk.Duration.seconds(10),
        memorySize: 128,
        environment: {
          TABLE_NAME: table.tableName,
          REGION: 'eu-west-1',
        },
      }
    );

    if (permissons == Permissons.READ) {
      table.grantReadData(this.lambdaFunction);
    } else if (permissons == Permissons.WRITE) {
      table.grantWriteData(this.lambdaFunction);
    }else if (permissons == Permissons.READ_WRITE){
      table.grantReadWriteData(this.lambdaFunction);
    }
  }
}