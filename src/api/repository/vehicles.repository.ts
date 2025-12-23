import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  ScanCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
  TransactWriteCommand,
} from "@aws-sdk/lib-dynamodb";
import { BaseDynamoDBRepository } from "./base/base.repository";
import { IVehicleRepository } from "./interfaces/repositories.interface";
import { VehicleResponseDto } from "../types/vehicle.types";
import { CreateVehicleDto, UpdateVehicleDto } from "../types/vehicle.types";
import { v4 as uuidv4 } from "uuid";
import { Tables } from "../constants";
import { ExternalApiError } from "../errors/errors";

export class VehicleDynamoDBRepository
  extends BaseDynamoDBRepository<
    VehicleResponseDto,
    CreateVehicleDto,
    UpdateVehicleDto
  >
  implements IVehicleRepository
{
  constructor(dynamoDbClient: DynamoDBDocumentClient) {
    super(Tables.VEHICLES, dynamoDbClient);
  }

  protected mapToEntity(item: any): VehicleResponseDto {
    return {
      id: item.id,
      licensePlate: item.licensePlate,
      model: item.model,
      transportType: item.transportType,
      status: item.status,
      pricePerKmEUR: item.pricePerKmEUR,
      capacity: item.capacity,
      fuelType: item.fuelType,
      currentLocation: item.currentLocation,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  private mapItemsToEntities(items?: any[]): VehicleResponseDto[] {
    return items?.map((item) => this.mapToEntity(item)) || [];
  }

  protected mapToDynamoDBItem(data: CreateVehicleDto | UpdateVehicleDto): any {
    const item: any = {};
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        item[key] = value;
      }
    });
    return item;
  }

  async findAll(filters?: any): Promise<VehicleResponseDto[]> {
    const appliedFilters = filters || {};

    try {
      if (appliedFilters.status) {
        const expressionAttributeNames: Record<string, string> = {
          "#status": "status",
        };
        const expressionAttributeValues: Record<string, any> = {
          ":status": appliedFilters.status,
        };
        let keyConditionExpression = "#status = :status";

        if (appliedFilters.transportType) {
          expressionAttributeNames["#transportType"] = "transportType";
          expressionAttributeValues[":transportType"] =
            appliedFilters.transportType;
          keyConditionExpression += " AND #transportType = :transportType";
        }

        const command = new QueryCommand({
          TableName: this.tableName,
          IndexName: "StatusTypeIndex",
          KeyConditionExpression: keyConditionExpression,
          ExpressionAttributeNames: expressionAttributeNames,
          ExpressionAttributeValues: expressionAttributeValues,
        });

        const response = await this.dynamoDbClient.send(command);
        return this.mapItemsToEntities(response.Items);
      }

      if (appliedFilters.transportType) {
        const command = new ScanCommand({
          TableName: this.tableName,
          FilterExpression: "#transportType = :transportType",
          ExpressionAttributeNames: {
            "#transportType": "transportType",
          },
          ExpressionAttributeValues: {
            ":transportType": appliedFilters.transportType,
          },
        });

        const response = await this.dynamoDbClient.send(command);
        return this.mapItemsToEntities(response.Items);
      }

      const command = new ScanCommand({
        TableName: this.tableName,
      });

      const response = await this.dynamoDbClient.send(command);
      return this.mapItemsToEntities(response.Items);
    } catch (error) {
      console.error("Error in findAll:", error);
      throw error;
    }
  }

  async findByStatus(status: string): Promise<VehicleResponseDto[]> {
    return this.findAll({ status });
  }

  async findByTransportType(
    transportType: string
  ): Promise<VehicleResponseDto[]> {
    return this.findAll({ transportType });
  }

  async findByLicensePlate(
    licensePlate: string
  ): Promise<VehicleResponseDto | null> {
    const command = new ScanCommand({
      TableName: this.tableName,
      FilterExpression: "#licensePlate = :licensePlate",
      ExpressionAttributeNames: {
        "#licensePlate": "licensePlate",
      },
      ExpressionAttributeValues: {
        ":licensePlate": licensePlate,
      },
    });

    const result = await this.dynamoDbClient.send(command);

    if (!result.Items || result.Items.length === 0) {
      return null;
    }

    return this.mapToEntity(result.Items[0]);
  }

  async create(data: CreateVehicleDto): Promise<VehicleResponseDto> {
    // Generate unique ID if not provided
    const id = this.generateId();
    const now = new Date().toISOString();

    const item = {
      id,
      ...this.mapToDynamoDBItem(data),
      status: data.status || "pending",
      createdAt: now,
      updatedAt: now,
    };

    try {
      const command = new PutCommand({
        TableName: this.tableName,
        Item: item,
        ConditionExpression: "attribute_not_exists(id)",
      });

      await this.dynamoDbClient.send(command);

      return this.mapToEntity(item);
    } catch (error) {
      if (
        error instanceof Error &&
        error.name === "ConditionalCheckFailedException"
      ) {
        throw new Error(`Vehicle with id ${id} already exists`);
      }
      console.error("Error creating vehicle:", error);
      throw error;
    }
  }

  async findById(id: string): Promise<VehicleResponseDto | null> {
    const command = new GetCommand({
      TableName: this.tableName,
      Key: { id },
    });

    const result = await this.dynamoDbClient.send(command);

    if (!result.Item) {
      return null;
    }

    return this.mapToEntity(result.Item);
  }

  async delete(id: string): Promise<void> {
    try {
      const command = new DeleteCommand({
        TableName: this.tableName,
        Key: { id },

        // Ensure vehicle exists at delete time
        ConditionExpression: "attribute_exists(id)",
      });

      await this.dynamoDbClient.send(command);
    } catch (error: any) {
      if (error.name === "ConditionalCheckFailedException") {
        throw new ExternalApiError("Vehicle not found", "VEHICLE_NOT_FOUND");
      }

      throw error;
    }
  }

  private generateId(): string {
    return `vehicle-${uuidv4().substring(0, 8)}`;
  }
}
