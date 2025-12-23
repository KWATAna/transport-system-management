import {
  CreateRouteDto,
  UpdateRouteDto,
  RouteResponseDto,
} from "../../types/route.types";
import {
  CreateVehicleDto,
  UpdateVehicleDto,
  VehicleResponseDto,
} from "../../types/vehicle.types";

export interface IRepository<T, CreateDto, UpdateDto> {
  create(data: CreateDto): Promise<T>;
  findById(id: string): Promise<T | null>;
  findAll(filters?: any): Promise<T[]>;
  update(id: string, data: UpdateDto): Promise<T | null>;
  delete(id: string): Promise<void>;
}

export interface IRouteRepository
  extends IRepository<RouteResponseDto, CreateRouteDto, UpdateRouteDto> {
  findByStatus(status: string): Promise<RouteResponseDto[]>;
  findByVehicleId(vehicleId: string): Promise<RouteResponseDto[]>;
  assignVehicle(
    routeId: string,
    vehicleId: string | null
  ): Promise<RouteResponseDto | null>;
}

export interface IVehicleRepository
  extends IRepository<VehicleResponseDto, CreateVehicleDto, UpdateVehicleDto> {
  findByStatus(status: string): Promise<VehicleResponseDto[]>;
  findByTransportType(transportType: string): Promise<VehicleResponseDto[]>;
  findByLicensePlate(licensePlate: string): Promise<VehicleResponseDto | null>;
}
