import { describe, it, expect } from "@jest/globals";
import { RouteService } from "../../src/api/service/routes.service";
import { CURRENCIES, ROUTE_STATUSES, VEHICLE_STATUSES } from "../../src/api/constants";
import {
  InvalidRouteStatusTransitionError,
  RouteInProgressError,
  VehicleNotAvailableError,
} from "../../src/api/errors/routes.errors";
import { VehicleResponseDto } from "../../src/api/types/vehicle.types";
import { IVehicleRepository } from "../../src/api/repository/interfaces/repositories.interface";
import { ICurrencyService } from "../../src/api/interfaces/currency.interface";

const baseRoute = {
  id: "route-12345678",
  startPoint: { lat: 50, lng: 30 },
  endPoint: { lat: 52, lng: 21 },
  departureDate: new Date().toISOString(),
  requiredTransportType: "truck",
  expectedRevenue: 1000,
  expectedRevenueEUR: 1000,
  expectedRevenueUSD: 1100,
  expectedRevenueUAH: 42000,
  revenueCurrency: CURRENCIES.EUR,
  distance: 100000,
  status: ROUTE_STATUSES.PENDING,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const baseVehicle: VehicleResponseDto = {
  id: "vehicle-12345678",
  licensePlate: "ABC-123",
  model: "Truck",
  transportType: "truck",
  status: VEHICLE_STATUSES.AVAILABLE,
  pricePerKmEUR: 1,
  capacity: 1000,
  fuelType: "diesel",
  currentLocation: { lat: 0, lng: 0 },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const toVehicle = (
  vehicle: Partial<VehicleResponseDto>
): VehicleResponseDto => ({
  ...baseVehicle,
  ...vehicle,
  id: vehicle.id ?? baseVehicle.id,
  licensePlate:
    vehicle.licensePlate ?? `LICENSE-${vehicle.id ?? baseVehicle.id}`,
  model: vehicle.model ?? baseVehicle.model,
  transportType: vehicle.transportType ?? baseVehicle.transportType,
  status: vehicle.status ?? baseVehicle.status,
  pricePerKmEUR: vehicle.pricePerKmEUR ?? baseVehicle.pricePerKmEUR,
  createdAt: vehicle.createdAt ?? new Date().toISOString(),
  updatedAt: vehicle.updatedAt ?? new Date().toISOString(),
});

const createVehicleRepo = (
  vehicles: Record<string, Partial<VehicleResponseDto>> = {}
) => {
  const updates: Array<{ id: string; data: any }> = [];
  const store = Object.entries(vehicles).reduce(
    (acc, [id, vehicle]) => {
      const normalized = toVehicle({ id, ...vehicle });
      acc[normalized.id] = normalized;
      return acc;
    },
    {} as Record<string, VehicleResponseDto>
  );

  const repo: IVehicleRepository = {
    create: async (data: any) => {
      const vehicle = toVehicle({
        ...data,
        id:
          data.id ??
          `vehicle-${Object.keys(store).length + 1}`,
      });
      store[vehicle.id] = vehicle;
      return vehicle;
    },
    findById: async (id: string) => store[id] ?? null,
    findAll: async () => Object.values(store),
    update: async (id: string, data: any) => {
      if (!store[id]) return null;
      updates.push({ id, data });
      const updated = toVehicle({
        ...store[id],
        ...data,
        id,
        updatedAt: new Date().toISOString(),
      });
      store[id] = updated;
      return updated;
    },
    delete: async (id: string) => {
      delete store[id];
    },
    findByStatus: async (status: string) =>
      Object.values(store).filter((vehicle) => vehicle.status === status),
    findByTransportType: async (transportType: string) =>
      Object.values(store).filter(
        (vehicle) => vehicle.transportType === transportType
      ),
    findByLicensePlate: async (licensePlate: string) =>
      Object.values(store).find(
        (vehicle) => vehicle.licensePlate === licensePlate
      ) ?? null,
  };

  return {
    updates,
    repo,
  };
};

const createRouteRepo = (routes: Record<string, any> = {}) => {
  const createCalls: any[] = [];
  const assignCalls: any[] = [];
  return {
    createCalls,
    assignCalls,
    repo: {
      create: async (data: any) => {
        createCalls.push(data);
        const route = { ...baseRoute, ...data, id: data.id ?? baseRoute.id };
        routes[route.id] = route;
        return route;
      },
      findById: async (id: string) => routes[id] ?? null,
      findAll: async () => Object.values(routes),
      update: async (id: string, data: any) => {
        if (!routes[id]) return null;
        routes[id] = { ...routes[id], ...data, id };
        return routes[id];
      },
      delete: async (id: string) => {
        delete routes[id];
      },
      findByStatus: async () => [],
      findByVehicleId: async () => [],
      assignVehicle: async (routeId: string, vehicleId: string | null) => {
        assignCalls.push({ routeId, vehicleId });
        if (!routes[routeId]) return null;
        routes[routeId] = { ...routes[routeId], vehicleId };
        return routes[routeId];
      },
    },
  };
};

const createCurrencyService = (
  convertCurrency?: ICurrencyService["convertCurrency"]
): ICurrencyService => ({
  convertCurrency: async (amount: number, from: string, to: string) => {
    const result =
      (await convertCurrency?.(amount, from, to)) ?? {
        converted: 0,
        rate: 0,
        timestamp: new Date().toISOString(),
      };
    return {
      ...result,
      timestamp: result.timestamp ?? new Date().toISOString(),
    };
  },
  getExchangeRate: async () => 1,
  getSupportedCurrencies: async () => Object.values(CURRENCIES),
});

describe("RouteService business rules", () => {
  it("create enriches revenue conversions and distance", async () => {
    const { repo: routeRepo, createCalls } = createRouteRepo({});
    const { repo: vehicleRepo } = createVehicleRepo();
    const capturedCoords: any[] = [];
    const conversions: any[] = [];

    const service = new RouteService(
      routeRepo,
      vehicleRepo,
      {
        calculateRouteDistance: async (coords) => {
          capturedCoords.push(coords);
          return {
            distance: 123000,
            distanceKm: 123,
            duration: 3600,
            durationHours: 1,
          };
        },
      },
      createCurrencyService(async (amount, from, to) => {
        conversions.push({ amount, from, to });
        return {
          converted: to === CURRENCIES.USD ? 1100 : 42000,
          rate: 1,
          timestamp: new Date().toISOString(),
        };
      })
    );

    const dto = {
      startPoint: { lat: 50.45, lng: 30.52 },
      endPoint: { lat: 52.23, lng: 21.01 },
      departureDate: new Date(Date.now() + 3600_000).toISOString(),
      requiredTransportType: "truck",
      expectedRevenue: 1000,
    };

    const result = await service.create(dto);

    expect(result.expectedRevenue).toBe(1000);
    expect(result.expectedRevenueUSD).toBe(1100);
    expect(result.expectedRevenueUAH).toBe(42000);
    expect(result.revenueCurrency).toBe(CURRENCIES.EUR);
    expect(capturedCoords[0]).toEqual([dto.startPoint, dto.endPoint]);
    expect(conversions.map((c) => c.to)).toEqual([
      CURRENCIES.USD,
      CURRENCIES.UAH,
    ]);
    expect(createCalls[0].distance).toBeDefined();
  });

  it("prevents transition from in-progress back to pending", async () => {
    const routes = {
      [baseRoute.id]: { ...baseRoute, status: ROUTE_STATUSES.IN_PROGRESS },
    };
    const { repo: routeRepo } = createRouteRepo(routes);
    const { repo: vehicleRepo } = createVehicleRepo();

    const service = new RouteService(
      routeRepo,
      vehicleRepo,
      {
        calculateRouteDistance: async () => ({ distance: 0, distanceKm: 0, duration: 0, durationHours: 0 }),
      },
      createCurrencyService()
    );

    await expect(
      service.update(baseRoute.id, { status: ROUTE_STATUSES.PENDING })
    ).rejects.toBeInstanceOf(InvalidRouteStatusTransitionError);
  });

  it("delete fails when route is in progress", async () => {
    const routes = {
      [baseRoute.id]: { ...baseRoute, status: ROUTE_STATUSES.IN_PROGRESS },
    };
    const { repo: routeRepo } = createRouteRepo(routes);
    const { repo: vehicleRepo } = createVehicleRepo();

    const service = new RouteService(
      routeRepo,
      vehicleRepo,
      {
        calculateRouteDistance: async () => ({ distance: 0, distanceKm: 0, duration: 0, durationHours: 0 }),
      },
      createCurrencyService()
    );

    await expect(service.delete(baseRoute.id)).rejects.toBeInstanceOf(
      RouteInProgressError
    );
  });

  it("assignVehicle rejects unavailable vehicle", async () => {
    const routes = { [baseRoute.id]: { ...baseRoute } };
    const { repo: routeRepo } = createRouteRepo(routes);
    const { repo: vehicleRepo } = createVehicleRepo({
      "vehicle-1": { id: "vehicle-1", status: VEHICLE_STATUSES.ASSIGNED },
    });

    const service = new RouteService(
      routeRepo,
      vehicleRepo,
      {
        calculateRouteDistance: async () => ({ distance: 0, distanceKm: 0, duration: 0, durationHours: 0 }),
      },
      createCurrencyService()
    );

    await expect(
      service.assignVehicle(baseRoute.id, "vehicle-1")
    ).rejects.toBeInstanceOf(VehicleNotAvailableError);
  });

  it("marking route as completed releases vehicle", async () => {
    const routeWithVehicle = {
      ...baseRoute,
      status: ROUTE_STATUSES.IN_PROGRESS,
      vehicleId: "vehicle-1",
    };
    const routes = { [routeWithVehicle.id]: routeWithVehicle };
    const { repo: routeRepo } = createRouteRepo(routes);
    const { repo: vehicleRepo, updates } = createVehicleRepo({
      "vehicle-1": { id: "vehicle-1", status: VEHICLE_STATUSES.ASSIGNED },
    });

    const service = new RouteService(
      routeRepo,
      vehicleRepo,
      {
        calculateRouteDistance: async () => ({ distance: 0, distanceKm: 0, duration: 0, durationHours: 0 }),
      },
      createCurrencyService()
    );

    const result = await service.update(routeWithVehicle.id, {
      status: ROUTE_STATUSES.COMPLETED,
    });

    expect(result.status).toBe(ROUTE_STATUSES.COMPLETED);
    expect(updates[0]).toEqual({
      id: "vehicle-1",
      data: { status: VEHICLE_STATUSES.AVAILABLE },
    });
  });

  it("getById returns vehicle details when linked", async () => {
    const routeWithVehicle = {
      ...baseRoute,
      vehicleId: "vehicle-1",
    };
    const routes = { [routeWithVehicle.id]: routeWithVehicle };
    const { repo: routeRepo } = createRouteRepo(routes);
    const { repo: vehicleRepo } = createVehicleRepo({
      "vehicle-1": { id: "vehicle-1", status: VEHICLE_STATUSES.AVAILABLE, model: "Truck" },
    });

    const service = new RouteService(
      routeRepo,
      vehicleRepo,
      {
        calculateRouteDistance: async () => ({ distance: 0, distanceKm: 0, duration: 0, durationHours: 0 }),
      },
      createCurrencyService()
    );

    const result = await service.getById(routeWithVehicle.id);

    expect(result.vehicle?.id).toBe("vehicle-1");
    expect(result.vehicle?.model).toBe("Truck");
  });
});
