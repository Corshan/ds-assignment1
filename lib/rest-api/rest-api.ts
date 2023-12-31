import * as apig from "aws-cdk-lib/aws-apigateway";
import { Construct } from "constructs";
import { Table } from "aws-cdk-lib/aws-dynamodb";
import { LambdaFn } from "./lambda";
import { Permissons } from "../../shared/utils";
import * as iam from 'aws-cdk-lib/aws-iam';

type RestAPIProps = {
    table: Table
    requestAuthorizer: apig.RequestAuthorizer
}

export class RestApi extends Construct {
    constructor(scope: Construct, id: string, props: RestAPIProps) {
        super(scope, id);

        const { table, requestAuthorizer } = props;
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

        const getReviewsByReviewerNameFn = new LambdaFn(
            this,
            "getReviewsByReviewerNameFn",
            {
                functionName: "getReviewsByReviewerName",
                fileName: "getReviewByReviewerName.ts",
                table: table,
                permissons: Permissons.READ
            }
        );

        const updateReviewContentFn = new LambdaFn(
            this,
            "updateReviewContentFn",
            {
                functionName: "updateReviewContent",
                fileName: "updateReviewContent.ts",
                table,
                permissons: Permissons.READ_WRITE
            }
        );

        const getAllReviewsByReviewerNameFn = new LambdaFn(
            this,
            "getAllReviewsByReviewerNameFn",
            {
                functionName: "getAllReviewsByReviewerName",
                fileName: "getAllReviewsByReviewerName.ts",
                table,
                permissons: Permissons.READ
            }
        );

        const getReviewTranslationFn = new LambdaFn(
            this,
            "getReviewTranslationFn",
            {
                functionName: "getReviewTranslation",
                fileName: "getReviewTranslation.ts",
                table,
                permissons: Permissons.READ
            }
        );

        const translatePolicy = new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ['translate:*'],
            resources: ['*']
        });

        getReviewTranslationFn.lambdaFunction.role?.attachInlinePolicy(
            new iam.Policy(this, 'translate-policy', {
                statements: [translatePolicy]
            })
        );

        // URL /movies
        const moviesEndpoint = api.root.addResource("movies");

        // URL /movies/reviews
        const reviewsEndpoint = moviesEndpoint.addResource("reviews");

        // URL /movies/reviews/{reviewerName}
        const reviewsReviewersNameEndpoint = reviewsEndpoint.addResource("{reviewerName}")

        // URL /movies/{movieId}
        const movieEndpoint = moviesEndpoint.addResource("{movieId}");

        // URL /movies/{movieId}/reviews
        const movieReviewsEndpoint = movieEndpoint.addResource("reviews");

        // URL /movies/{movieId}/reviews/{reviewerName}
        const reviewerNameEndpoint = movieReviewsEndpoint.addResource("{reviewerName}");

        // URL /movies/{movieId}/reviews/{reviewerName}/tanslation
        const tanslationEndpoint = reviewerNameEndpoint.addResource("tanslation")


        // GET /movies/reviews
        reviewsEndpoint.addMethod(
            "GET",
            new apig.LambdaIntegration(getReviewsFn.lambdaFunction, { proxy: true })
        );

        // POST /movies/reviews
        reviewsEndpoint.addMethod(
            "POST",
            new apig.LambdaIntegration(addReviewFn.lambdaFunction, { proxy: true }),
            {
                authorizer: requestAuthorizer,
                authorizationType: apig.AuthorizationType.CUSTOM
            }
        );

        // GET /movies/reviews/{reviewerName}
        reviewsReviewersNameEndpoint.addMethod(
            "GET",
            new apig.LambdaIntegration(getAllReviewsByReviewerNameFn.lambdaFunction, { proxy: true })
        );

        // GET /movies/{movieId}/reviews
        movieReviewsEndpoint.addMethod(
            "GET",
            new apig.LambdaIntegration(getReviewsByIdFn.lambdaFunction, { proxy: true })
        );

        // GET /moives/{movieId}/reviews/{reviewerName}
        reviewerNameEndpoint.addMethod(
            "GET",
            new apig.LambdaIntegration(getReviewsByReviewerNameFn.lambdaFunction, { proxy: true })
        );

        // PUT /movies/{movieId}/reviews/{reviewerName}
        reviewerNameEndpoint.addMethod(
            "PUT",
            new apig.LambdaIntegration(updateReviewContentFn.lambdaFunction, { proxy: true }),
            {
                authorizer: requestAuthorizer,
                authorizationType: apig.AuthorizationType.CUSTOM
            }
        );

        // GET /movies/{movieId}/reviews/{reviewerName}/translation
        tanslationEndpoint.addMethod(
            "GET",
            new apig.LambdaIntegration(getReviewTranslationFn.lambdaFunction, { proxy: true })
        );
    }
}