import { Request, Response, NextFunction } from "express";
import { GetItemCommand } from "@aws-sdk/client-dynamodb";
import { dynamoDbClient } from "../clients/dynamodb.client";

export class HealthController {
  checkHealth = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const databaseStatus = await this.checkDatabaseConnection();
      res.status(200).json({
        status: "OK",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        services: {
          database: databaseStatus,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  private async checkDatabaseConnection(): Promise<
    "connected" | "disconnected"
  > {
    try {
      await dynamoDbClient.send(
        new GetItemCommand({
          TableName: process.env.ROUTES_TABLE ?? "Routes",
          Key: {
            id: { S: "__healthcheck__" },
          },
        })
      );
      return "connected";
    } catch (error) {
      console.error("DynamoDB health check failed:", error);
      return "disconnected";
    }
  }
}
