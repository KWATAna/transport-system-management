import { Router } from "express";
import { RoutesController } from "../controllers/routes.controller";
import { RouteService } from "../service/routes.service";
import { OSRMService } from "../clients/osrm.client";
import { FixerService } from "../clients/fixer.client";
import {
  createRouteRepository,
  createVehicleRepository,
} from "../repository/repository.provider";
import { validateBody } from "../middleware/validation.middleware";
import { apiKeyMiddleware } from "../middleware/api-key.middleware";
import {
  createRouteSchema,
  updateRouteSchema,
  assignVehicleSchema,
} from "../validation/route.schema";

const routeRepository = createRouteRepository();
const vehicleRepository = createVehicleRepository();
const osrmService = new OSRMService();
const currencyService = new FixerService();
const routeService = new RouteService(
  routeRepository,
  vehicleRepository,
  osrmService,
  currencyService
);

const router = Router();
const routesController = new RoutesController(routeService);

router.use(apiKeyMiddleware);

router.get("/", routesController.getAllRoutes);

router.get("/:id", routesController.getRouteById);

router.post(
  "/create",
  validateBody(createRouteSchema),
  routesController.createRoute
);

router.put(
  "/:id",
  validateBody(updateRouteSchema),
  routesController.updateRoute
);

router.delete("/:id", routesController.deleteRoute);

router.put(
  "/:id/assign-vehicle",
  validateBody(assignVehicleSchema),
  routesController.assignVehicle
);

export default router;
