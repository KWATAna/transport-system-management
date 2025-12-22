import {
  DynamoDBClient,
  CreateTableCommand,
  CreateTableCommandInput,
} from "@aws-sdk/client-dynamodb";
import * as dotenv from "dotenv";
dotenv.config();

const dynamoDBClient = new DynamoDBClient({
  region: process.env.AWS_REGION || "eu-central-1",
  endpoint: process.env.AWS_DYNAMODB_ENDPOINT,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "local-dummy-key",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "local-dummy-secret",
  },
});

const createRoutesTableParams: CreateTableCommandInput = {
  TableName: "Routes",
  KeySchema: [{ AttributeName: "id", KeyType: "HASH" }],
  AttributeDefinitions: [
    { AttributeName: "id", AttributeType: "S" },
    { AttributeName: "vehicleId", AttributeType: "S" },
    { AttributeName: "status", AttributeType: "S" },
    { AttributeName: "departureDate", AttributeType: "S" },
    { AttributeName: "requiredTransportType", AttributeType: "S" },
  ],
  GlobalSecondaryIndexes: [
    {
      IndexName: "VehicleIdIndex",
      KeySchema: [
        { AttributeName: "vehicleId", KeyType: "HASH" },
        { AttributeName: "departureDate", KeyType: "RANGE" },
      ],
      Projection: { ProjectionType: "ALL" },
      ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
    },
    {
      IndexName: "StatusIndex",
      KeySchema: [
        { AttributeName: "status", KeyType: "HASH" },
        { AttributeName: "departureDate", KeyType: "RANGE" },
      ],
      Projection: { ProjectionType: "ALL" },
      ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
    },
    {
      IndexName: "TransportTypeIndex",
      KeySchema: [
        { AttributeName: "requiredTransportType", KeyType: "HASH" },
        { AttributeName: "status", KeyType: "RANGE" },
      ],
      Projection: { ProjectionType: "ALL" },
      ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
    },
  ],
  BillingMode: "PAY_PER_REQUEST",
};

// Create Vehicles Table
const createVehiclesTableParams: CreateTableCommandInput = {
  TableName: "Vehicles",
  KeySchema: [{ AttributeName: "id", KeyType: "HASH" }],
  AttributeDefinitions: [
    { AttributeName: "id", AttributeType: "S" },
    { AttributeName: "licensePlate", AttributeType: "S" },
    { AttributeName: "status", AttributeType: "S" },
    { AttributeName: "transportType", AttributeType: "S" },
    { AttributeName: "currentRouteId", AttributeType: "S" },
  ],
  GlobalSecondaryIndexes: [
    {
      IndexName: "LicensePlateIndex",
      KeySchema: [{ AttributeName: "licensePlate", KeyType: "HASH" }],
      Projection: { ProjectionType: "ALL" },
      ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
    },
    {
      IndexName: "StatusTypeIndex",
      KeySchema: [
        { AttributeName: "status", KeyType: "HASH" },
        { AttributeName: "transportType", KeyType: "RANGE" },
      ],
      Projection: { ProjectionType: "ALL" },
      ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
    },
    {
      IndexName: "CurrentRouteIndex",
      KeySchema: [{ AttributeName: "currentRouteId", KeyType: "HASH" }],
      Projection: { ProjectionType: "ALL" },
      ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
    },
  ],
  BillingMode: "PAY_PER_REQUEST",
};

async function createTables() {
  try {
    console.log("Creating tables...");

    const routesCommand = new CreateTableCommand(createRoutesTableParams);
    const vehiclesCommand = new CreateTableCommand(createVehiclesTableParams);

    await dynamoDBClient.send(routesCommand);
    console.log("Routes table created successfully");

    await dynamoDBClient.send(vehiclesCommand);
    console.log("Vehicles table created successfully");
  } catch (error) {
    console.error("Error creating tables:", error);
  }
}

createTables();
