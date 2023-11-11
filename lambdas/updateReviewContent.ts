import { UpdateCommand, UpdateCommandInput } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import Ajv from "ajv";
import schema from "../shared/types.schema.json";
import { createDDbDocClient } from "../shared/utils";

const ajv = new Ajv();
const isValidBodyParams = ajv.compile(schema.definitions["UpdateReview"] || {});
const ddbDocClient = createDDbDocClient();

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
    const parameters = event?.pathParameters;
    const reviewerName = parameters?.reviewerName?.replaceAll("%20", " ");
    const movieId = parameters?.movieId ? parseInt(parameters?.movieId) : undefined;

    const body = event.body ? JSON.parse(event.body) : undefined

    if (!reviewerName || !movieId) {
        return {
            statusCode: 404,
            headers: {
                "content-type": "application/json",
            },
            body: JSON.stringify({ message: (!reviewerName) ? "Missing reviewer name" : "Missing movieId" })
        }
    }

    if (!body) {
        return {
            statusCode: 500,
            headers: {
                "content-type": "application/json",
            },
            body: JSON.stringify({ message: "Missing request body" }),
        };
    }

    if (!isValidBodyParams(body)) {
        return {
            statusCode: 500,
            headers: {
                "content-type": "application/json",
            },
            body: JSON.stringify({
                message: "Incorrect Schema",
                schema: schema.definitions["UpdateReview"]
            }),
        };
    }

    const command: UpdateCommandInput = {
        TableName: process.env.TABLE_NAME,
        Key: {
            movieId: movieId,
            reviewerName: reviewerName
        },
        UpdateExpression: "set content = :content",
        ExpressionAttributeValues: {
            ":content": body.content
        }
    }

    const output = await ddbDocClient.send(
        new UpdateCommand(command)
    );

    return {
        statusCode: 200,
        headers: {
            "content-type": "application/json",
        },
        body: JSON.stringify({
            message: "Table updated"
        }),
    };
}