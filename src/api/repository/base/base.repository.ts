import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { IRepository } from "../interfaces/repositories.interface";
import { Tables } from "../../constants";

export abstract class BaseDynamoDBRepository<T, CreateDto, UpdateDto>
  implements IRepository<T, CreateDto, UpdateDto>
{
  protected tableName: string;
  protected vehiclesTable: string;
  protected routesTable: string;

  protected dynamoDbClient: DynamoDBDocumentClient;

  constructor(tableName: string, dynamoDbClient: DynamoDBDocumentClient) {
    this.tableName = tableName;
    this.dynamoDbClient = dynamoDbClient;
    this.vehiclesTable = Tables.VEHICLES;
    this.routesTable = Tables.ROUTES;
  }

  protected abstract mapToEntity(item: any): T;
  protected abstract mapToDynamoDBItem(data: CreateDto | UpdateDto): any;

  async create(data: CreateDto): Promise<T> {
    throw new Error("Method not implemented");
  }

  async findById(id: string): Promise<T | null> {
    throw new Error("Method not implemented");
  }

  async findAll(filters?: any): Promise<T[]> {
    throw new Error("Method not implemented");
  }

  async update(id: string, data: UpdateDto): Promise<T | null> {
    throw new Error("Method not implemented");
  }

  async delete(id: string): Promise<void> {
    throw new Error("Method not implemented");
  }
}
