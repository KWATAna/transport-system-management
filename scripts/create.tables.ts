import {
  DynamoDBClient,
  CreateTableCommand,
  CreateTableCommandInput,
  DescribeTableCommand,
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
    { AttributeName: "status", AttributeType: "S" },
    { AttributeName: "vehicleId", AttributeType: "S" },
    { AttributeName: "requiredTransportType", AttributeType: "S" },
  ],
  GlobalSecondaryIndexes: [
    {
      IndexName: "StatusIndex",
      KeySchema: [{ AttributeName: "status", KeyType: "HASH" }],
      Projection: { ProjectionType: "ALL" },
    },
    {
      IndexName: "TransportTypeIndex",
      KeySchema: [
        { AttributeName: "requiredTransportType", KeyType: "HASH" },
        { AttributeName: "status", KeyType: "RANGE" },
      ],
      Projection: { ProjectionType: "ALL" },
    },
    {
      IndexName: "VehicleIdIndex",
      KeySchema: [{ AttributeName: "vehicleId", KeyType: "HASH" }],
      Projection: { ProjectionType: "ALL" },
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
    { AttributeName: "status", AttributeType: "S" },
    { AttributeName: "transportType", AttributeType: "S" },
    { AttributeName: "licensePlate", AttributeType: "S" },
  ],
  GlobalSecondaryIndexes: [
    {
      IndexName: "StatusTypeIndex",
      KeySchema: [
        { AttributeName: "status", KeyType: "HASH" },
        { AttributeName: "transportType", KeyType: "RANGE" },
      ],
      Projection: { ProjectionType: "ALL" },
    },
    {
      IndexName: "TransportTypeIndex",
      KeySchema: [{ AttributeName: "transportType", KeyType: "HASH" }],
      Projection: { ProjectionType: "ALL" },
    },

    {
      IndexName: "LicensePlateIndex",
      KeySchema: [{ AttributeName: "licensePlate", KeyType: "HASH" }],
      Projection: { ProjectionType: "ALL" },
    },
  ],
  BillingMode: "PAY_PER_REQUEST",
};

async function assertTableDoesNotExist(
  tableName: string | undefined
): Promise<boolean> {
  try {
    await dynamoDBClient.send(
      new DescribeTableCommand({
        TableName: tableName,
      })
    );
    return true;
  } catch (error: unknown) {
    if ((error as { name?: string }).name === "ResourceNotFoundException") {
      return false;
    }
    throw error;
  }
}

async function createTables() {
  try {
    console.log("Creating tables...");

    const routesCommand = new CreateTableCommand(createRoutesTableParams);
    const vehiclesCommand = new CreateTableCommand(createVehiclesTableParams);

    const doesRouteExist = await assertTableDoesNotExist(
      createRoutesTableParams.TableName
    );

    if (!doesRouteExist) {
      await dynamoDBClient.send(routesCommand);
      console.log("Routes table created successfully");
    }

    const doesVehcileExist = await assertTableDoesNotExist(
      createVehiclesTableParams.TableName
    );

    if (!doesVehcileExist) {
      await dynamoDBClient.send(vehiclesCommand);
      console.log("Vehicles table created successfully");
    }
  } catch (error) {
    console.error("Error creating tables:", error);
  }
}

createTables();
