import "./config/env";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { errorHandler } from "./api/middleware/error.middleware";
import healthRoutes from "./api/routes/health.routes";
import routesRoutes from "./api/routes/routes.router";
import vehiclesRoutes from "./api/routes/vehicles.router";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./docs/swagger";

const app = express();

// Basic middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get("/docs.json", (_req, res) => {
  res.json(swaggerSpec);
});

// Health check
app.use("/health", healthRoutes);

// API Routes
app.use((req, _res, next) => {
  if (Buffer.isBuffer(req.body)) {
    const contentType = req.headers["content-type"] || "";

    if (contentType.includes("application/json") && req.body.length > 0) {
      try {
        req.body = JSON.parse(req.body.toString("utf-8"));
      } catch (err) {
        return next(err);
      }
    }
  }
  next();
});

app.use("/api/routes", routesRoutes);
app.use("/api/vehicles", vehiclesRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.use(errorHandler);

export default app;
