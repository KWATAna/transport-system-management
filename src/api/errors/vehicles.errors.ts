import { NotFoundError, ConflictError } from "./errors";

export class VehicleNotFoundError extends NotFoundError {
  public readonly name: string;

  constructor(id: string) {
    super("Vehicle", id);
    this.name = "VehicleNotFoundError";
  }
}

export class DuplicateLicensePlateError extends ConflictError {
  public readonly name: string;

  constructor(licensePlate: string) {
    super(`Vehicle with license plate ${licensePlate} already exists`, {
      licensePlate,
    });
    this.name = "DuplicateLicensePlateError";
  }
}

export class VehicleAssignedError extends ConflictError {
  public readonly name: string;

  constructor(vehicleId: string, routeId: string) {
    super(`Vehicle ${vehicleId} is currently assigned to route ${routeId}`, {
      vehicleId,
      routeId,
    });
    this.name = "VehicleAssignedError";
  }
}
