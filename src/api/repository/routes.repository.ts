import { v4 as uuidv4 } from "uuid";
import { VEHICLE_STATUSES, Tables } from "../constants";
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
import { ROUTE_STATUSES } from "../constants";
import { ApiError } from "../errors/api.error";

import { BaseDynamoDBRepository } from "./base/base.repository";
import { IRouteRepository } from "../interfaces/repositories.interface";
import {
  CreateRouteDto,
  RouteResponseDto,
  UpdateRouteDto,
} from "../types/route.types";

export class RouteDynamoDBRepository
  extends BaseDynamoDBRepository<
    RouteResponseDto,
    CreateRouteDto,
    UpdateRouteDto
  >
  implements IRouteRepository
{
  constructor(dynamoDbClient: DynamoDBDocumentClient) {
    super(Tables.ROUTES, dynamoDbClient);
  }

  protected mapToEntity(item: any): RouteResponseDto {
    if (!item) {
      throw new Error("Route record is missing or undefined");
    }

    return {
      id: item.id,
      startPoint: item.startPoint,
      endPoint: item.endPoint,
      departureDate: item.departureDate,
      completionDate: item.completionDate,
      distance: item.distance,
      requiredTransportType: item.requiredTransportType,
      expectedRevenue: item.expectedRevenue,
      expectedRevenueUAH: item.expectedRevenueUAH,
      expectedRevenueUSD: item.expectedRevenueUSD,
      revenueCurrency: item.revenueCurrency,
      status: item.status || "pending",
      vehicleId: item.vehicleId,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  protected mapToDynamoDBItem(data: CreateRouteDto | UpdateRouteDto): any {
    // Filter out undefined values
    const item: any = {};
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        item[key] = value;
      }
    });
    return item;
  }

  async findAll(): Promise<RouteResponseDto[]> {
    try {
      const command = new ScanCommand({
        TableName: this.tableName,
      });

      const response = await this.dynamoDbClient.send(command);
      return response.Items?.map((item) => this.mapToEntity(item)) || [];
    } catch (error) {
      console.error("Error in findAll:", error);
      throw error;
    }
  }

  async update(
    id: string,
    data: UpdateRouteDto
  ): Promise<RouteResponseDto | null> {
    const updateData = this.mapToDynamoDBItem(data);
    const now = new Date().toISOString();
    updateData.updatedAt = now;

    const fields = Object.keys(updateData);
    if (fields.length === 0) {
      return this.findById(id);
    }

    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    const setClauses = fields.map((field) => {
      expressionAttributeNames[`#${field}`] = field;
      expressionAttributeValues[`:${field}`] = (updateData as any)[field];
      return `#${field} = :${field}`;
    });

    const command = new UpdateCommand({
      TableName: this.tableName,
      Key: { id },
      UpdateExpression: `SET ${setClauses.join(", ")}`,
      ConditionExpression: "attribute_exists(id)",
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: "ALL_NEW",
    });

    const response = await this.dynamoDbClient.send(command);
    return response.Attributes ? this.mapToEntity(response.Attributes) : null;
  }

  async create(data: CreateRouteDto): Promise<RouteResponseDto> {
    const id = this.generateId();
    const now = new Date().toISOString();

    const item = {
      id,
      ...this.mapToDynamoDBItem(data),
      status: data.status || "pending",
      createdAt: now,
      updatedAt: now,
    };

    if (!item.startPoint || !item.endPoint || !item.departureDate) {
      throw new Error(
        "Missing required fields: startPoint, endPoint, departureDate"
      );
    }

    try {
      const command = new PutCommand({
        TableName: this.tableName,
        Item: item,
        // Optional: Add condition to prevent overwriting existing item
        ConditionExpression: "attribute_not_exists(id)",
      });

      await this.dynamoDbClient.send(command);

      return this.mapToEntity(item);
    } catch (error) {
      if (
        error instanceof Error &&
        error.name === "ConditionalCheckFailedException"
      ) {
        throw new Error(`Route with id ${id} already exists`);
      }
      console.error("Error creating route:", error);
      throw error;
    }
  }

  async findByStatus(status: string): Promise<RouteResponseDto[]> {
    try {
      const command = new QueryCommand({
        TableName: this.tableName,
        IndexName: "StatusIndex",
        KeyConditionExpression: "#status = :status",
        ExpressionAttributeNames: {
          "#status": "status",
        },
        ExpressionAttributeValues: {
          ":status": status,
        },
      });

      const response = await this.dynamoDbClient.send(command);
      return response.Items?.map((item) => this.mapToEntity(item)) || [];
    } catch (error) {
      console.error("Error finding routes by status:", error);
      throw error;
    }
  }

  async findByVehicleId(vehicleId: string): Promise<RouteResponseDto[]> {
    try {
      const command = new QueryCommand({
        TableName: this.tableName,
        IndexName: "VehicleIdIndex", // Assuming you have this GSI
        KeyConditionExpression: "vehicleId = :vehicleId",
        ExpressionAttributeValues: {
          ":vehicleId": vehicleId,
        },
      });

      const response = await this.dynamoDbClient.send(command);
      return response.Items?.map((item) => this.mapToEntity(item)) || [];
    } catch (error) {
      console.error("Error finding routes by vehicleId:", error);
      throw error;
    }
  }

  async assignVehicle(
    routeId: string,
    vehicleId: string | null
  ): Promise<RouteResponseDto | null> {
    const now = new Date().toISOString();

    if (!vehicleId) {
      const route = await this.findById(routeId);

      if (!route) {
        return null;
      }

      if (!route.vehicleId) {
        return route;
      }

      try {
        const command = new TransactWriteCommand({
          TransactItems: [
            {
              Update: {
                TableName: this.tableName,
                Key: { id: routeId },
                UpdateExpression:
                  "SET #status = :pending, updatedAt = :updatedAt REMOVE vehicleId",
                ConditionExpression:
                  "attribute_exists(id) AND vehicleId = :currentVehicleId",
                ExpressionAttributeNames: {
                  "#status": "status",
                },
                ExpressionAttributeValues: {
                  ":pending": ROUTE_STATUSES.PENDING,
                  ":currentVehicleId": route.vehicleId,
                  ":updatedAt": now,
                },
              },
            },

            {
              Update: {
                TableName: this.vehiclesTable,
                Key: { id: route.vehicleId },
                UpdateExpression:
                  "SET #status = :available, updatedAt = :updatedAt REMOVE assigned, currentRouteId",
                ConditionExpression: "attribute_exists(id)",
                ExpressionAttributeNames: {
                  "#status": "status",
                },
                ExpressionAttributeValues: {
                  ":available": VEHICLE_STATUSES.AVAILABLE,
                  ":updatedAt": now,
                },
              },
            },
          ],
        });

        await this.dynamoDbClient.send(command);
        return this.findById(routeId);
      } catch (error) {
        if (
          error instanceof Error &&
          error.name === "TransactionCanceledException"
        ) {
          throw new ApiError(
            "Vehicle or route cannot be unassigned",
            400,
            "UNASSIGNMENT_FAILED"
          );
        }

        throw error;
      }
    }

    try {
      const command = new TransactWriteCommand({
        TransactItems: [
          {
            Update: {
              TableName: this.tableName,
              Key: { id: routeId },
              UpdateExpression:
                "SET vehicleId = :vehicleId, #status = :inProgress, updatedAt = :updatedAt",
              ConditionExpression:
                "attribute_exists(id) AND #status = :pending",
              ExpressionAttributeNames: {
                "#status": "status",
              },
              ExpressionAttributeValues: {
                ":vehicleId": vehicleId,
                ":pending": ROUTE_STATUSES.PENDING,
                ":inProgress": ROUTE_STATUSES.IN_PROGRESS,
                ":updatedAt": now,
              },
            },
          },

          {
            Update: {
              TableName: this.vehiclesTable,
              Key: { id: vehicleId },
              UpdateExpression:
                "SET #status = :assigned, assigned = :true, currentRouteId = :routeId, updatedAt = :updatedAt",
              ConditionExpression:
                "attribute_exists(id) AND #status = :available",
              ExpressionAttributeNames: {
                "#status": "status",
              },
              ExpressionAttributeValues: {
                ":assigned": VEHICLE_STATUSES.ASSIGNED,
                ":available": VEHICLE_STATUSES.AVAILABLE,
                ":true": true,
                ":routeId": routeId,
                ":updatedAt": now,
              },
            },
          },
        ],
      });

      await this.dynamoDbClient.send(command);
      return this.findById(routeId);
    } catch (error) {
      if (
        error instanceof Error &&
        error.name === "TransactionCanceledException"
      ) {
        throw new ApiError(
          "Vehicle or route cannot be assigned",
          400,
          "ASSIGNMENT_FAILED"
        );
      }

      throw error;
    }
  }

  // Additional useful methods

  async getActiveRoutes(): Promise<RouteResponseDto[]> {
    try {
      const command = new QueryCommand({
        TableName: this.tableName,
        IndexName: "StatusIndex",
        KeyConditionExpression: "#status IN (:assigned, :inProgress)",
        ExpressionAttributeNames: {
          "#status": "status",
        },
        ExpressionAttributeValues: {
          ":assigned": "assigned",
          ":inProgress": "in-progress",
        },
      });

      const response = await this.dynamoDbClient.send(command);
      return response.Items?.map((item) => this.mapToEntity(item)) || [];
    } catch (error) {
      console.error("Error getting active routes:", error);
      throw error;
    }
  }

  async updateStatus(
    routeId: string,
    status: "pending" | "assigned" | "in-progress" | "completed" | "cancelled"
  ): Promise<RouteResponseDto | null> {
    try {
      const now = new Date().toISOString();
      let updateExpression = "SET #status = :status, updatedAt = :updatedAt";
      const expressionValues: any = {
        ":status": status,
        ":updatedAt": now,
      };

      if (status === "completed") {
        updateExpression += ", completionDate = :completionDate";
        expressionValues[":completionDate"] = now;
      }

      if (status === "completed") {
        updateExpression += " REMOVE vehicleId";
      }

      const command = new UpdateCommand({
        TableName: this.tableName,
        Key: { id: routeId },
        UpdateExpression: updateExpression,
        ConditionExpression: "attribute_exists(id)",
        ExpressionAttributeNames: {
          "#status": "status",
        },
        ExpressionAttributeValues: expressionValues,
        ReturnValues: "ALL_NEW",
      });

      const response = await this.dynamoDbClient.send(command);
      return this.mapToEntity(response.Attributes);
    } catch (error) {
      console.error("Error updating route status:", error);
      throw error;
    }
  }

  async findRoutesByDateRange(
    startDate: string,
    endDate: string
  ): Promise<RouteResponseDto[]> {
    try {
      const command = new QueryCommand({
        TableName: this.tableName,
        IndexName: "StatusIndex",
        KeyConditionExpression:
          "#status = :status AND departureDate BETWEEN :startDate AND :endDate",
        ExpressionAttributeNames: {
          "#status": "status",
        },
        ExpressionAttributeValues: {
          ":status": "pending",
          ":startDate": startDate,
          ":endDate": endDate,
        },
      });

      const response = await this.dynamoDbClient.send(command);
      return response.Items?.map((item) => this.mapToEntity(item)) || [];
    } catch (error) {
      console.error("Error finding routes by date range:", error);
      throw error;
    }
  }

  async assignVehicleWithTransaction(
    routeId: string,
    vehicleId: string
  ): Promise<{ route: RouteResponseDto; success: boolean }> {
    try {
      const route = await this.findById(routeId);
      if (!route) {
        throw new Error(`Route ${routeId} not found`);
      }

      if (route.status !== "pending") {
        throw new Error(`Route ${routeId} is not in pending state`);
      }

      const updatedRoute = await this.assignVehicle(routeId, vehicleId);

      return {
        route: updatedRoute as RouteResponseDto,
        success: true,
      };
    } catch (error) {
      console.error("Error in vehicle assignment transaction:", error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const command = new DeleteCommand({
        TableName: this.tableName,
        Key: { id },

        ConditionExpression: "attribute_exists(id) AND #status <> :inProgress",

        ExpressionAttributeNames: {
          "#status": "status",
        },
        ExpressionAttributeValues: {
          ":inProgress": ROUTE_STATUSES.IN_PROGRESS,
        },
      });

      await this.dynamoDbClient.send(command);
    } catch (error: any) {
      if (error.name === "ConditionalCheckFailedException") {
        throw new ApiError(
          "Route cannot be deleted (not found or in progress)",
          400,
          "CANNOT_DELETE_ROUTE"
        );
      }

      throw error;
    }
  }

  async findById(id: string): Promise<RouteResponseDto | null> {
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

  private generateId(): string {
    return `ROUTE-${Date.now()}-${uuidv4().substring(0, 8)}`;
  }
}
