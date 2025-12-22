import { Request, Response, NextFunction } from "express";
import { IRouteService } from "../interfaces/services.interface";
import { CreateRouteDto, UpdateRouteDto } from "../types/route.types";
import { StatusCodes } from "http-status-codes";
import {
  createRouteSchema,
  routeQuerySchema,
  updateRouteSchema,
  assignVehicleSchema,
} from "../validation/route.schema";

export class RoutesController {
  constructor(private routeService: IRouteService) {}

  getAllRoutes = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const queryParams = routeQuerySchema.parse(req.query);

      const routes = await this.routeService.getAll(queryParams);

      res.status(200).json({
        success: true,
        data: routes,
        message: "Routes retrieved successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  getRouteById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const route = await this.routeService.getById(id);

      res.status(200).json({
        success: true,
        data: route,
        message: "Route retrieved successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  createRoute = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const validatedData = createRouteSchema.parse(req.body);

      const route = await this.routeService.create(validatedData);

      res.status(201).json({
        success: true,
        data: route,
        message: "Route created successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  updateRoute = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const validatedData: UpdateRouteDto = updateRouteSchema.parse(req.body);
      const route = await this.routeService.update(id, validatedData);

      if (!route) {
        res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          error: "Route not found",
        });
        return;
      }

      res.status(StatusCodes.OK).json({
        success: true,
        data: route,
        message: "Route updated successfully",
      });

      res.status(200).json({
        success: true,
        data: route,
        message: "Route updated successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  deleteRoute = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;

      const deleted = await this.routeService.delete(id);

      res.status(StatusCodes.OK).json({
        success: true,
        message: "Route deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  assignVehicle = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const { vehicleId } = assignVehicleSchema.parse(req.body);

      const route = await this.routeService.assignVehicle(id, vehicleId);

      if (!route) {
        res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          error: "Route not found or cannot be assigned",
        });
        return;
      }

      res.status(StatusCodes.OK).json({
        success: true,
        data: route,
        message: vehicleId
          ? "Vehicle assigned successfully"
          : "Vehicle unassigned successfully",
      });
    } catch (error) {
      next(error);
    }
  };
}
