import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";

export const apiKeyMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const configuredKey = process.env.API_KEY;

  if (!configuredKey) {
    res.status(StatusCodes.UNAUTHORIZED).json({
      success: false,
      error: "API key is not configured",
    });
    return;
  }

  const providedKey = req.header("x-api-key");

  if (!providedKey || providedKey !== configuredKey) {
    res.status(StatusCodes.UNAUTHORIZED).json({
      success: false,
      error: "Invalid API key",
    });
    return;
  }

  next();
};
