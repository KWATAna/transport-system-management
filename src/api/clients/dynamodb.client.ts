import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const dynamoDbClient = DynamoDBDocumentClient.from(
  new DynamoDBClient({
    region: process.env.AWS_REGION || "eu-central-1",
    endpoint: process.env.AWS_DYNAMODB_ENDPOINT,
  })
);

export { dynamoDbClient };
