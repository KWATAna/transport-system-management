import { ApiError } from "./api.error";

export class ValidationError extends ApiError {
  constructor(message: string, details?: any) {
    super(message, 400, "VALIDATION_ERROR", details);
    this.name = "ValidationError";
  }
}

export class NotFoundError extends ApiError {
  constructor(resource: string, id?: string) {
    const message = id
      ? `${resource} with ID ${id} not found`
      : `${resource} not found`;

    super(message, 404, "NOT_FOUND");
    this.name = "NotFoundError";
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string = "Unauthorized access") {
    super(message, 401, "UNAUTHORIZED");
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends ApiError {
  constructor(message: string = "Access forbidden") {
    super(message, 403, "FORBIDDEN");
    this.name = "ForbiddenError";
  }
}

export class ConflictError extends ApiError {
  constructor(message: string, details?: any) {
    super(message, 409, "CONFLICT", details);
    this.name = "ConflictError";
  }
}

export class ExternalApiError extends ApiError {
  constructor(service: string, message: string, details?: any) {
    super(
      `External API error (${service}): ${message}`,
      502,
      "EXTERNAL_API_ERROR",
      details
    );
    this.name = "ExternalApiError";
  }
}

export class DatabaseError extends ApiError {
  constructor(operation: string, details?: any) {
    super(`Database error during ${operation}`, 500, "DATABASE_ERROR", details);
    this.name = "DatabaseError";
  }
}
