import {
  CreateRouteDto,
  UpdateRouteDto,
  RouteResponseDto,
} from "../types/route.types";
import {
  CreateVehicleDto,
  UpdateVehicleDto,
  VehicleResponseDto,
} from "../types/vehicle.types";

export interface IService<T, CreateDto, UpdateDto> {
  create(data: CreateDto): Promise<T>;
  getById(id: string): Promise<T>;
  getAll(filters?: any): Promise<T[]>;
  update(id: string, data: UpdateDto): Promise<T>;
  delete(id: string): Promise<void>;
}

export interface IRouteService
  extends IService<RouteResponseDto, CreateRouteDto, UpdateRouteDto> {
  assignVehicle(
    routeId: string,
    vehicleId: string | null
  ): Promise<RouteResponseDto>;
  calculateRouteDistance(
    coordinates: Array<{ lat: number; lng: number }>
  ): Promise<{
    distance: number;
    distanceKm: number;
    duration: number;
    durationHours: number;
  }>;
  convertCurrency(
    amount: number,
    from: string,
    to: string
  ): Promise<{
    converted: number;
    rate: number;
  }>;
}

export interface IVehicleService
  extends IService<VehicleResponseDto, CreateVehicleDto, UpdateVehicleDto> {
  getAvailableVehicles(transportType?: string): Promise<VehicleResponseDto[]>;
  updateStatus(id: string, status: string): Promise<VehicleResponseDto>;
}
