import { Router } from "express";
import { VehiclesController } from "../controllers/vehicles.controller";
import { VehicleService } from "../service/vehicles.service";
import { createVehicleRepository } from "../repository/repository.provider";
import { validateBody, validateQuery } from "../middleware/validation.middleware";
import { apiKeyMiddleware } from "../middleware/api-key.middleware";
import { createVehicleSchema, vehicleQuerySchema } from "../validation/vehicle.schema";

const vehicleRepository = createVehicleRepository();
const vehicleService = new VehicleService(vehicleRepository);
const router = Router();
const vehiclesController = new VehiclesController(vehicleService);

router.use(apiKeyMiddleware);

router.get("/", validateQuery(vehicleQuerySchema), vehiclesController.getAllVehicles);

router.get("/:id", vehiclesController.getVehicleById);

router.post(
  "/create",
  validateBody(createVehicleSchema),
  vehiclesController.createVehicle
);

router.put("/:id", vehiclesController.updateVehicle);

router.delete("/:id", vehiclesController.deleteVehicle);

export default router;
