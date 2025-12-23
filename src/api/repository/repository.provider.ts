import {
  IRouteRepository,
  IVehicleRepository,
} from "./interfaces/repositories.interface";
import { VehicleDynamoDBRepository } from "./vehicles.repository";
import { RouteDynamoDBRepository } from "./routes.repository";
import { dynamoDbClient } from "../clients/dynamodb.client";

export const createVehicleRepository = (): IVehicleRepository => {
  return new VehicleDynamoDBRepository(dynamoDbClient);
};

export const createRouteRepository = (): IRouteRepository => {
  return new RouteDynamoDBRepository(dynamoDbClient);
};
