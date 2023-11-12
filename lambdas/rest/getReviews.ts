import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { createDDbDocClient } from "../../shared/utils";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";

const ddbDocClient = createDDbDocClient();

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
    const commandOutput = await ddbDocClient.send(
        new ScanCommand({
            TableName: process.env.TABLE_NAME
        })
    );

    const body = {
        data: commandOutput.Items
    }

    return {
        statusCode: 200,
        headers: {
            "content-type": "application/json",
        },
        body: JSON.stringify({body})
    }
}