import { Request, Response, NextFunction } from "express";
import { IVehicleService } from "../interfaces/services.interface";
import { UpdateVehicleDto } from "../types/vehicle.types";
import { createVehicleSchema } from "../validation/vehicle.schema";

export class VehiclesController {
  constructor(private vehicleService: IVehicleService) {}

  getAllVehicles = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { status, transportType } = req.query;

      const filters: any = {};
      if (status) filters.status = status as string;
      if (transportType) filters.transportType = transportType as string;

      const vehicles = await this.vehicleService.getAll(filters);

      res.status(200).json({
        success: true,
        data: vehicles,
        message: "Vehicles retrieved successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  getVehicleById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const vehicle = await this.vehicleService.getById(id);

      res.status(200).json({
        success: true,
        data: vehicle,
        message: "Vehicle retrieved successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  createVehicle = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const validatedData = createVehicleSchema.parse(req.body);

      const vehicle = await this.vehicleService.create(validatedData);

      res.status(201).json({
        success: true,
        data: vehicle,
        message: "Vehicle created successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  updateVehicle = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const updateDto: UpdateVehicleDto = req.body;
      const vehicle = await this.vehicleService.update(id, updateDto);

      res.status(200).json({
        success: true,
        data: vehicle,
        message: "Vehicle updated successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  deleteVehicle = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      await this.vehicleService.delete(id);

      res.status(200).json({
        success: true,
        message: "Vehicle deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  };
}
