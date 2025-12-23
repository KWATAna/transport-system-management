import { DynamoDBClient, DynamoDBClientConfig } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const clientConfig: DynamoDBClientConfig = {
  region: process.env.AWS_REGION || "eu-central-1",
};

console.log("DynamoDB Client Config:", clientConfig);
if (process.env.AWS_DYNAMODB_ENDPOINT) {
  clientConfig.endpoint = process.env.AWS_DYNAMODB_ENDPOINT;
}

const dynamoDbClient = DynamoDBDocumentClient.from(
  new DynamoDBClient(clientConfig)
);

export { dynamoDbClient };
