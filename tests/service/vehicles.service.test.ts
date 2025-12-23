import { describe, it, expect } from "@jest/globals";
import { VehicleService } from "../../src/api/service/vehicles.service";
import { VEHICLE_STATUSES } from "../../src/api/constants";
import {
  DuplicateLicensePlateError,
  VehicleAssignedError,
  VehicleNotFoundError,
} from "../../src/api/errors/vehicles.errors";
import { IVehicleRepository } from "../../src/api/repository/interfaces/repositories.interface";
import {
  CreateVehicleDto,
  UpdateVehicleDto,
  VehicleResponseDto,
} from "../../src/api/types/vehicle.types";

const baseVehicle: VehicleResponseDto = {
  id: "vehicle-1",
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
  licensePlate: vehicle.licensePlate ?? baseVehicle.licensePlate,
  model: vehicle.model ?? baseVehicle.model,
  transportType: vehicle.transportType ?? baseVehicle.transportType,
  status: vehicle.status ?? baseVehicle.status,
  pricePerKmEUR: vehicle.pricePerKmEUR ?? baseVehicle.pricePerKmEUR,
  createdAt: vehicle.createdAt ?? new Date().toISOString(),
  updatedAt: vehicle.updatedAt ?? new Date().toISOString(),
});

const createVehicleRepository = (
  vehicles: Record<string, Partial<VehicleResponseDto>> = {}
): IVehicleRepository & {
  creations: CreateVehicleDto[];
  updates: Array<{ id: string; data: UpdateVehicleDto }>;
  deleteCalls: string[];
  findAllFilters: any[];
} => {
  const creations: CreateVehicleDto[] = [];
  const updates: Array<{ id: string; data: UpdateVehicleDto }> = [];
  const deleteCalls: string[] = [];
  const findAllFilters: any[] = [];

  const store = Object.entries(vehicles).reduce(
    (acc, [id, vehicle]) => {
      const normalized = toVehicle({ id, ...vehicle });
      acc[normalized.id] = normalized;
      return acc;
    },
    {} as Record<string, VehicleResponseDto>
  );

  const repo: IVehicleRepository = {
    create: async (data: CreateVehicleDto) => {
      creations.push(data);
      const vehicle = toVehicle({
        ...data,
        id: data.licensePlate,
      });
      store[vehicle.id] = vehicle;
      return vehicle;
    },
    findById: async (id: string) => store[id] ?? null,
    findAll: async (filters?: any) => {
      findAllFilters.push(filters);
      const values = Object.values(store);
      if (!filters) return values;

      return values.filter((vehicle) => {
        const matchesStatus =
          !filters.status || vehicle.status === filters.status;
        const matchesTransport =
          !filters.transportType ||
          vehicle.transportType === filters.transportType;
        return matchesStatus && matchesTransport;
      });
    },
    update: async (id: string, data: UpdateVehicleDto) => {
      if (!store[id]) return null;
      updates.push({ id, data });
      const merged = {
        ...store[id],
        ...data,
        id,
        updatedAt: new Date().toISOString(),
      } as Partial<VehicleResponseDto>;

      if (merged.currentLocation === null) {
        delete merged.currentLocation;
      }

      const updated = toVehicle(merged);
      store[id] = updated;
      return updated;
    },
    delete: async (id: string) => {
      deleteCalls.push(id);
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

  return { ...repo, creations, updates, deleteCalls, findAllFilters };
};

describe("VehicleService", () => {
  it("creates vehicle when license plate is unique", async () => {
    const repo = createVehicleRepository();
    const service = new VehicleService(repo);

    const dto: CreateVehicleDto = {
      licensePlate: "NEW-1",
      model: "Van",
      transportType: "van",
      status: VEHICLE_STATUSES.AVAILABLE,
      pricePerKmEUR: 2,
    };

    const result = await service.create(dto);

    expect(repo.creations.length).toBe(1);
    expect(result.licensePlate).toBe(dto.licensePlate);
    expect(result.model).toBe(dto.model);
  });

  it("throws on duplicate license plate", async () => {
    const repo = createVehicleRepository({
      existing: { licensePlate: "DUP-1" },
    });
    const service = new VehicleService(repo);

    await expect(
      service.create({
        licensePlate: "DUP-1",
        model: "Truck",
        transportType: "truck",
        pricePerKmEUR: 3,
      })
    ).rejects.toBeInstanceOf(DuplicateLicensePlateError);
  });

  it("throws when vehicle not found on getById", async () => {
    const repo = createVehicleRepository();
    const service = new VehicleService(repo);

    await expect(service.getById("missing")).rejects.toBeInstanceOf(
      VehicleNotFoundError
    );
  });

  it("returns vehicles using parsed filters", async () => {
    const repo = createVehicleRepository({
      "vehicle-1": { status: VEHICLE_STATUSES.AVAILABLE, transportType: "truck" },
      "vehicle-2": { status: VEHICLE_STATUSES.ASSIGNED, transportType: "van" },
    });
    const service = new VehicleService(repo);

    const result = await service.getAll({ status: 123 as any, transportType: "truck" });

    expect(repo.findAllFilters[0]).toEqual({
      status: undefined,
      transportType: "truck",
    });
    expect(result.map((v) => v.id)).toContain("vehicle-1");
    expect(result.map((v) => v.id)).not.toContain("vehicle-2");
  });

  it("updates vehicle and returns latest state", async () => {
    const repo = createVehicleRepository({
      "vehicle-1": { status: VEHICLE_STATUSES.AVAILABLE },
    });
    const service = new VehicleService(repo);

    const updated = await service.update("vehicle-1", {
      status: VEHICLE_STATUSES.ASSIGNED,
    });

    expect(repo.updates[0]).toEqual({
      id: "vehicle-1",
      data: { status: VEHICLE_STATUSES.ASSIGNED },
    });
    expect(updated.status).toBe(VEHICLE_STATUSES.ASSIGNED);
  });

  it("throws when updating non-existent vehicle", async () => {
    const repo = createVehicleRepository();
    const service = new VehicleService(repo);

    await expect(
      service.update("missing", { status: VEHICLE_STATUSES.ASSIGNED })
    ).rejects.toBeInstanceOf(VehicleNotFoundError);
  });

  it("prevents deleting assigned vehicle", async () => {
    const repo = createVehicleRepository({
      "vehicle-1": { status: "assigned" },
    });
    const service = new VehicleService(repo);

    await expect(service.delete("vehicle-1")).rejects.toBeInstanceOf(
      VehicleAssignedError
    );
    expect(repo.deleteCalls.length).toBe(0);
  });

  it("deletes available vehicle", async () => {
    const repo = createVehicleRepository({
      "vehicle-1": { status: VEHICLE_STATUSES.AVAILABLE },
    });
    const service = new VehicleService(repo);

    await service.delete("vehicle-1");

    expect(repo.deleteCalls).toContain("vehicle-1");
  });
});
