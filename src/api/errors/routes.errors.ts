import { NotFoundError, ConflictError, ValidationError } from "./errors";
import { ApiError } from "./api.error";

export class RouteNotFoundError extends NotFoundError {
  constructor(id: string) {
    super("Route", id);
    this.name = "RouteNotFoundError";
  }
}

export class VehicleNotAvailableError extends ConflictError {
  constructor(vehicleId: string) {
    super(`Vehicle ${vehicleId} is not available`, { vehicleId });
    this.name = "VehicleNotAvailableError";
  }
}

export class InvalidRouteStatusTransitionError extends ValidationError {
  constructor(fromStatus: string, toStatus: string) {
    super(`Cannot transition from ${fromStatus} to ${toStatus}`, {
      fromStatus,
      toStatus,
    });
    this.name = "InvalidRouteStatusTransitionError";
  }
}

export class RouteInProgressError extends ConflictError {
  constructor(operation: string) {
    super(`Cannot ${operation} a route that is in progress`);
    this.name = "RouteInProgressError";
  }
}

export class RouteDistanceCalculationError extends ApiError {
  constructor(details?: any) {
    super(
      "Failed to calculate route distance",
      500,
      "ROUTE_CALCULATION_ERROR",
      details
    );
    this.name = "RouteDistanceCalculationError";
  }
}

export class RequiredTransportTypeChangeNotAllowedError extends ValidationError {
  constructor(vehicleId: string) {
    super(
      "Cannot change required transport type while a vehicle is assigned",
      { vehicleId }
    );
    this.name = "RequiredTransportTypeChangeNotAllowedError";
  }
}
