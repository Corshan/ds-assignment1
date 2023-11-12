import { ScanCommand, ScanCommandInput } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { createDDbDocClient } from "../../shared/utils";
import * as AWS from 'aws-sdk';
import { Review } from "../../shared/types";

const ddbDocClient = createDDbDocClient();

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
    const parameters = event?.pathParameters;
    const queryParams = event.queryStringParameters;
    const reviewerName = parameters?.reviewerName?.replaceAll("%20", " ");
    const movieId = parameters?.movieId ? parseInt(parameters?.movieId) : undefined;
    const langauge = queryParams?.language;


    if (!reviewerName) {
        return {
            statusCode: 404,
            headers: {
                "content-type": "application/json",
            },
            body: JSON.stringify({ message: "Missing reviewer name" })
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

    if (!langauge) {
        return {
            statusCode: 404,
            headers: {
                "content-type": "application/json",
            },
            body: JSON.stringify({
                message: "Missing langauge",
                queryParams
            })
        }
    }

    try {
        const command: ScanCommandInput = {
            TableName: process.env.TABLE_NAME,
            FilterExpression: "movieId = :m and reviewerName = :r",
            ExpressionAttributeValues: {
                ":m": movieId,
                ":r": reviewerName
            }
        }

        const commandOutput = await ddbDocClient.send(
            new ScanCommand(command)
        );

        const json = JSON.stringify(commandOutput.Items);
        const data = JSON.parse(json) as Review[];

        const tanslation = new AWS.Translate();

        const promises: Promise<unknown>[] = [];
        
        data.forEach(async e => {
            const translatedText = tanslation.translateText(
                {
                    Text: e.content,
                    SourceLanguageCode: "en",
                    TargetLanguageCode: langauge
                }
            ).promise();

            promises.push(translatedText);

            const p  = await translatedText;
            e.content = p.TranslatedText;
        });

        await Promise.all(promises)

        return {
            statusCode: 200,
            headers: {
                "content-type": "application/json",
            },
            body: JSON.stringify({
                data: data
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