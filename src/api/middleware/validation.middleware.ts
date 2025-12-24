import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { StatusCodes } from "http-status-codes";

export const validateBody =
  <T extends { parseAsync: (data: unknown) => Promise<any> }>(schema: T) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
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

      next(error);
    }
  };

export const validateQuery =
  <T extends { parseAsync: (data: unknown) => Promise<any> }>(schema: T) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = await schema.parseAsync(req.query);
      Object.assign(req.query as Record<string, unknown>, parsed);
      next();
    } catch (error) {
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

      next(error);
    }
  };
