import { IVehicleService } from "../interfaces/services.interface";
import { IVehicleRepository } from "../repository/interfaces/repositories.interface";
import {
  CreateVehicleDto,
  UpdateVehicleDto,
  VehicleResponseDto,
} from "../types/vehicle.types";
import {
  DuplicateLicensePlateError,
  VehicleAssignedError,
  VehicleNotFoundError,
} from "../errors/vehicles.errors";

export class VehicleService implements IVehicleService {
  constructor(private vehicleRepository: IVehicleRepository) {}

  async create(data: CreateVehicleDto): Promise<VehicleResponseDto> {
    const existingVehicle = await this.vehicleRepository.findByLicensePlate(
      data.licensePlate
    );
    if (existingVehicle) {
      throw new DuplicateLicensePlateError(data.licensePlate);
    }

    return this.vehicleRepository.create(data);
  }

  async getById(id: string): Promise<VehicleResponseDto> {
    const vehicle = await this.vehicleRepository.findById(id);

    if (!vehicle) {
      throw new VehicleNotFoundError(id);
    }

    return vehicle;
  }

  async getAll(filters?: any): Promise<VehicleResponseDto[]> {
    return this.vehicleRepository.findAll(filters);
  }

  async update(
    id: string,
    data: UpdateVehicleDto
  ): Promise<VehicleResponseDto> {
    await this.getById(id);

    const updatedVehicle = await this.vehicleRepository.update(id, data);

    if (!updatedVehicle) {
      throw new VehicleNotFoundError(id);
    }

    return updatedVehicle;
  }

  async delete(id: string): Promise<void> {
    const vehicle = await this.getById(id);

    if (!vehicle) {
      throw new VehicleNotFoundError(id);
    }

    // Business rule: cannot delete assigned vehicle
    if (vehicle.status === "assigned") {
      const currentRouteId =
        (vehicle as any).currentRouteId || "unknown-route-id";
      throw new VehicleAssignedError(vehicle.id, currentRouteId);
    }

    await this.vehicleRepository.delete(id);
  }

  async getAvailableVehicles(
    transportType?: string
  ): Promise<VehicleResponseDto[]> {
    // Get all FREE vehicles
    // TODO fix this in repository
    const freeVehicles = await this.vehicleRepository.findByStatus("FREE");

    // Filter by transport type if specified
    if (transportType) {
      return freeVehicles.filter(
        (vehicle) => vehicle.transportType === transportType
      );
    }

    return freeVehicles;
  }

  async updateStatus(id: string, status: string): Promise<VehicleResponseDto> {
    return this.update(id, { status });
  }
}
