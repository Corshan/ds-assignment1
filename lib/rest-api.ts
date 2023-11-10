import * as apig from "aws-cdk-lib/aws-apigateway";
import { Construct } from "constructs";
import { Table } from "aws-cdk-lib/aws-dynamodb";
import { LambdaFn } from "./lambda";
import { Permissons } from "../shared/utils";

type RestAPIProps = {
    table: Table
}

export class RestApi extends Construct {
    constructor(scope: Construct, id: string, props: RestAPIProps) {
        super(scope, id);

        const { table } = props;
        // REST API 
        const api = new apig.RestApi(this, "RestAPI", {
            description: "Rest API",
            deployOptions: {
                stageName: "dev",
            },
            // 👇 enable CORS
            defaultCorsPreflightOptions: {
                allowHeaders: ["Content-Type", "X-Amz-Date"],
                allowMethods: ["OPTIONS", "GET", "POST", "PUT", "PATCH", "DELETE"],
                allowCredentials: true,
                allowOrigins: ["*"],
            },
        });

        const getReviewsFn = new LambdaFn(this, "getReviewsFn", {
            functionName: "getReviews",
            fileName: "getReviews.ts",
            table: table,
            permissons: Permissons.READ
        });

        const addReviewFn = new LambdaFn(this, "addReviewFn", {
            functionName: "addReview",
            fileName: "addReview.ts",
            table: table,
            permissons: Permissons.WRITE
        });

        const getReviewsByIdFn = new LambdaFn(this, "getReviewsByIdFn", {
            functionName: "getReviewsById",
            fileName: "getReviewsById.ts",
            table: table,
            permissons: Permissons.READ
        });

        const moviesEndpoint = api.root.addResource("movies");
        const movieEndpoint = moviesEndpoint.addResource("{movieId}");
        const movieReviewsEndpoint = movieEndpoint.addResource("reviews");
        const reviewsEndpoint = moviesEndpoint.addResource("reviews");

        // GET /movies/reviews
        reviewsEndpoint.addMethod(
            "GET",
            new apig.LambdaIntegration(getReviewsFn.lambdaFunction, { proxy: true })
        );

        // POST /movies/reviews
        reviewsEndpoint.addMethod(
            "POST",
            new apig.LambdaIntegration(addReviewFn.lambdaFunction, { proxy: true })
        );

        // GET /movies/{movieId}/reviews
        movieReviewsEndpoint.addMethod(
            "GET",
            new apig.LambdaIntegration(getReviewsByIdFn.lambdaFunction, { proxy: true })
        );
    }
}