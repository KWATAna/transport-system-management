import { VehicleResponseDto } from "./vehicle.types";

export interface Coordinate {
  lat: number;
  lng: number;
}

export interface CreateRouteDto {
  startPoint: Coordinate;
  endPoint: Coordinate;
  departureDate: string; // ISO string
  completionDate?: string; // ISO string
  requiredTransportType: string; // TODO: Use TransportType enum
  expectedRevenue: number;
  revenueCurrency?: string;
  status?: "pending" | "assigned" | "in-progress" | "completed" | "cancelled";
  notes?: string;
}

export interface UpdateRouteDto {
  status?: "pending" | "assigned" | "in-progress" | "completed" | "cancelled";
  expectedRevenue?: number;
  revenueCurrency?: string;
  vehicleId?: string | null;
  departureDate?: string;
  completionDate?: string;
  actualRevenue?: number;
  actualRevenueCurrency?: string;
  notes?: string;
}

export interface RouteResponseDto {
  id: string;
  startPoint: Coordinate;
  endPoint: Coordinate;
  departureDate: string;
  completionDate?: string;
  requiredTransportType: string;
  expectedRevenue: number;
  distance: number;
  expectedRevenueUAH: number;
  expectedRevenueUSD: number;
  revenueCurrency: string;
  actualRevenue?: number;
  actualRevenueCurrency?: string;
  status: string;
  vehicleId?: string;
  vehicle?: VehicleResponseDto;
  createdAt: string;
  updatedAt: string;
}
