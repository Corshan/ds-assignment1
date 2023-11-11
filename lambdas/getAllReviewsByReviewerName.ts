import { QueryCommandInput, ScanCommandInput, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { createDDbDocClient } from "../shared/utils";

const ddbDocClient = createDDbDocClient();

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
    const parameters = event.pathParameters;
    const reviewerName = parameters?.reviewerName?.replaceAll("%20", " ");

    try {
        if (!reviewerName) {
            return {
                statusCode: 404,
                headers: {
                    "content-type": "application/json",
                },
                body: JSON.stringify({ message: "missing reviewerName" })
            }
        }

        const command: ScanCommandInput = {
            TableName: process.env.TABLE_NAME,
            FilterExpression: "reviewerName = :rn",
            ExpressionAttributeValues: {
                ":rn": reviewerName
            }
        }

        const output = await ddbDocClient.send(
            new ScanCommand(command)
        );

        return {
            statusCode: 200,
            headers: {
                "content-type": "application/json",
            },
            body: JSON.stringify({
                parameters: {
                    reviewerName
                },
                data: output.Items
            })
        }

    } catch (error) {
        return {
            statusCode: 500,
            headers: {
                "content-type": "application/json",
            },
            body: JSON.stringify({ error })
        }
    }
}