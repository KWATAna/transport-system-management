// src/shared/middleware/error.middleware.ts
import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { ZodError } from "zod";
import { ApiError } from "../errors/api.error";

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (error instanceof ApiError) {
    res.status(error.statusCode).json({
      success: false,
      error: error.message,
      code: error.code,
      details: error.details,
      timestamp: error.timestamp,
    });
    return;
  }

  // invalid JSON payload error from express.json()
  if ((error as any).type === "entity.parse.failed") {
    res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      error: "Invalid JSON payload",
      details: error.message,
    });
    return;
  }

  if (error instanceof ZodError) {
    res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      error: "Validation failed",
      details: error.issues.map(({ path, message }) => ({
        path: path.join("."),
        message,
      })),
    });
    return;
  }

  if (error.message.includes("Invalid") || error.message.includes("Cannot")) {
    res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      error: error.message,
    });
    return;
  }

  if (error.message.includes("not found")) {
    res.status(StatusCodes.NOT_FOUND).json({
      success: false,
      error: error.message,
    });
    return;
  }

  if (error.name === "ConditionalCheckFailedException") {
    res.status(StatusCodes.CONFLICT).json({
      success: false,
      error: "Resource already exists or condition failed",
    });
    return;
  }

  res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    success: false,
    error: "Internal server error",
  });
};
