import { ScanCommand, ScanCommandInput } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { createDDbDocClient } from "../../shared/utils";

const ddbDocClient = createDDbDocClient();

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
    const parameters = event?.pathParameters;
    const reviewerName = parameters?.reviewerName;
    const movieId = parameters?.movieId ? parseInt(parameters?.movieId) : undefined;

    if (!reviewerName) {
        return {
            statusCode: 404,
            headers: {
                "content-type": "application/json",
            },
            body: JSON.stringify({ message: "Missing param" })
        }
    }

    if (!movieId) {
        return {
            statusCode: 404,
            headers: {
                "content-type": "application/json",
            },
            body: JSON.stringify({ message: "Missing movieId" })
        }
    }

    try {
        let command: ScanCommandInput;

        if (reviewerName.match('^[0-9]*$')) {
            command = {
                TableName: process.env.TABLE_NAME,
                FilterExpression: "movieId = :m and contains(reviewDate, :y)",
                ExpressionAttributeValues: {
                    ":m": movieId,
                    ":y": reviewerName
                }
            }
        } else {
            command = {
                TableName: process.env.TABLE_NAME,
                FilterExpression: "movieId = :m and reviewerName = :r",
                ExpressionAttributeValues: {
                    ":m": movieId,
                    ":r": reviewerName.replaceAll("%20", " ")
                }
            }
        }



        const commandOutput = await ddbDocClient.send(
            new ScanCommand(command)
        );

        return {
            statusCode: 200,
            headers: {
                "content-type": "application/json",
            },
            body: JSON.stringify({
                data: commandOutput.Items,
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