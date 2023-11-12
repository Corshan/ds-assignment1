import { APIGatewayProxyHandlerV2 } from "aws-lambda";

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, QueryCommandInput, QueryCommand, ScanCommand, ScanCommandInput } from "@aws-sdk/lib-dynamodb";
import { createDDbDocClient } from "../../shared/utils";

const ddbDocClient = createDDbDocClient();

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
    try {
        const parameters = event.pathParameters;

        const queryParams = event.queryStringParameters;
        const movieId = parameters?.movieId ? parseInt(parameters.movieId) : undefined;

        if (!movieId) {
            return {
                statusCode: 404,
                headers: {
                    "content-type": "application/json",
                },
                body: JSON.stringify({ Message: "Missing movie Id" }),
            };
        }

        const minRating = (queryParams?.minRating) ? parseInt(queryParams?.minRating) : undefined;

        let command: ScanCommandInput = {
            TableName: process.env.TABLE_NAME,
        }

        if (minRating) {
            command = {
                ...command,
                FilterExpression: "movieId = :m and rating >= :r",
                ExpressionAttributeValues: {
                    ":m": movieId,
                    ":r": minRating
                }
            }

        } else {
            command = {
                ...command,
                FilterExpression: "movieId = :m",
                ExpressionAttributeValues: {
                    ":m": movieId
                },
            }
        }


        const ouput = await ddbDocClient.send(
            new ScanCommand(command)
        );

        const body = {
            data: ouput.Items
        }

        return {
            statusCode: 200,
            headers: {
                "content-type": "application/json",
            },
            body: JSON.stringify({ body })
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