import * as cdk from "aws-cdk-lib";
import { APIGatewayRequestAuthorizerHandler } from "aws-lambda";
import { CookieMap, createPolicy, parseCookies, verifyToken } from "../../shared/utils";

export const handler: APIGatewayRequestAuthorizerHandler = async (event) => {

  const cookies: CookieMap = parseCookies(event);

  if (!cookies) {
    return {
      principalId: "",
      policyDocument: createPolicy(event, "Deny"),
    };
  }

  const verifiedJwt = await verifyToken(
    cookies.token,
    process.env.USER_POOL_ID!,
    "eu-west-1"
  );

  return {
    principalId: verifiedJwt ? verifiedJwt.sub!.toString() : "",
    policyDocument: createPolicy(event, verifiedJwt ? "Allow" : "Deny"),
  };
};