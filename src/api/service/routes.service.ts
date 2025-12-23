import { IRouteService } from "../interfaces/services.interface";
import { IGeolocationService } from "../clients/interfaces/geolocation.interface";
import { ICurrencyService } from "../interfaces/currency.interface";
import { IRouteRepository } from "../repository/interfaces/repositories.interface";
import { CURRENCIES, ROUTE_STATUSES } from "../constants";
import {
  CreateRouteDto,
  UpdateRouteDto,
  RouteResponseDto,
} from "../types/route.types";
import { IVehicleRepository } from "../repository/interfaces/repositories.interface";
import { VEHICLE_STATUSES } from "../constants";
import {
  RouteInProgressError,
  RouteNotFoundError,
  VehicleNotAvailableError,
  InvalidRouteStatusTransitionError,
} from "../errors/routes.errors";
import { VehicleNotFoundError } from "../errors/vehicles.errors";

export class RouteService implements IRouteService {
  constructor(
    private routeRepository: IRouteRepository,
    private vehicleRepository: IVehicleRepository,
    private geolocationService: IGeolocationService,
    private currencyService: ICurrencyService
  ) {}

  async create(data: CreateRouteDto): Promise<RouteResponseDto> {
    const coordinates = [data.startPoint];
    coordinates.push(data.endPoint);

    const routeInfo = await this.geolocationService.calculateRouteDistance(
      coordinates
    );

    const defaultCurrency = CURRENCIES.EUR;
    let expectedRevenue = data.expectedRevenue;

    const usdConversion = await this.currencyService.convertCurrency(
      expectedRevenue,
      defaultCurrency,
      CURRENCIES.USD
    );

    const uahConversion = await this.currencyService.convertCurrency(
      expectedRevenue,
      defaultCurrency,
      CURRENCIES.UAH
    );

    const routeData = {
      ...data,
      distance: routeInfo.distance,
      expectedRevenueEUR: expectedRevenue,
      expectedRevenueUSD: usdConversion.converted,
      expectedRevenueUAH: uahConversion.converted,
      revenueCurrency: defaultCurrency,
    };

    return this.routeRepository.create(routeData);
  }

  async getById(id: string): Promise<RouteResponseDto> {
    const route = await this.routeRepository.findById(id);

    if (!route) {
      throw new RouteNotFoundError(id);
    }

    return route;
  }

  async getAll(filters?: any): Promise<RouteResponseDto[]> {
    return this.routeRepository.findAll(filters);
  }

  async update(id: string, data: UpdateRouteDto): Promise<RouteResponseDto> {
    const existingRoute = await this.getById(id);

    if (data.status) {
      if (
        existingRoute.status === ROUTE_STATUSES.IN_PROGRESS &&
        data.status === ROUTE_STATUSES.PENDING
      ) {
        throw new InvalidRouteStatusTransitionError(
          existingRoute.status,
          data.status
        );
      }
    }

    const { vehicleId, ...routeUpdates } = data;
    let routeAfterVehicleChange: RouteResponseDto | null = null;

    if (vehicleId !== undefined) {
      routeAfterVehicleChange = await this.assignVehicle(id, vehicleId);
    }

    const hasOtherUpdates = Object.values(routeUpdates).some(
      (value) => value !== undefined
    );

    if (!hasOtherUpdates) {
      return routeAfterVehicleChange ?? existingRoute;
    }

    const updatedRoute = await this.routeRepository.update(
      id,
      routeUpdates as UpdateRouteDto
    );

    if (!updatedRoute) {
      throw new RouteNotFoundError(id);
    }

    return updatedRoute;
  }

  async delete(id: string): Promise<void> {
    const route = await this.getById(id);

    if (!route) {
      throw new RouteNotFoundError(id);
    }

    if (route.status === ROUTE_STATUSES.IN_PROGRESS) {
      throw new RouteInProgressError("delete");
    }

    await this.routeRepository.delete(id);
  }

  async assignVehicle(
    routeId: string,
    vehicleId: string | null
  ): Promise<RouteResponseDto> {
    // TODO: Validate route and vehicle
    const route = await this.getById(routeId);

    if (vehicleId) {
      const vehicle = await this.vehicleRepository.findById(vehicleId);
      if (!vehicle) {
        throw new VehicleNotFoundError(vehicleId);
      }

      if (vehicle.status !== VEHICLE_STATUSES.AVAILABLE) {
        throw new VehicleNotAvailableError(vehicleId);
      }
    }

    const updatedRoute = await this.routeRepository.assignVehicle(
      routeId,
      vehicleId
    );

    if (!updatedRoute) {
      throw new RouteNotFoundError(routeId);
    }

    return updatedRoute;
  }

  async calculateRouteDistance(
    coordinates: Array<{ lat: number; lng: number }>
  ): Promise<{
    distance: number;
    distanceKm: number;
    duration: number;
    durationHours: number;
  }> {
    return this.geolocationService.calculateRouteDistance(coordinates);
  }

  async convertCurrency(
    amount: number,
    from: string,
    to: string
  ): Promise<{
    converted: number;
    rate: number;
  }> {
    const result = await this.currencyService.convertCurrency(amount, from, to);
    return {
      converted: result.converted,
      rate: result.rate,
    };
  }
}
