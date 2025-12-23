import { z } from "zod";

export const coordinateSchema = z.object({
  lat: z
    .number()
    .min(-90, "Latitude must be between -90 and 90")
    .max(90, "Latitude must be between -90 and 90"),
  lng: z
    .number()
    .min(-180, "Longitude must be between -180 and 180")
    .max(180, "Longitude must be between -180 and 180"),
  address: z.string().optional(),
});

export const RouteStatus = z.enum([
  "pending",
  "assigned",
  "in-progress",
  "completed",
  "cancelled",
]);

export const TransportType = z.enum(["truck", "van", "car", "refrigerated"]);

export const Currency = z.enum(["EUR", "USD", "UAH"]);

const routeIdRegex = /^route-[0-9a-f]{8}$/;
const vehicleIdRegex = /^vehicle-[0-9a-f]{8}$/;

export const createRouteSchema = z
  .object({
    id: z.string().regex(routeIdRegex, "Invalid route ID format").optional(),

    startPoint: coordinateSchema.refine((point) => {
      return Math.abs(point.lat) <= 90 && Math.abs(point.lng) <= 180;
    }, "Invalid coordinates"),

    endPoint: coordinateSchema.refine((point) => {
      return Math.abs(point.lat) <= 90 && Math.abs(point.lng) <= 180;
    }, "Invalid coordinates"),

    departureDate: z.string().refine(
      (date) => {
        const d = new Date(date);
        return !isNaN(d.getTime()) && d > new Date();
      },
      {
        message: "Departure date must be a valid future date in ISO format",
      }
    ),

    completionDate: z
      .string()
      .refine((date) => {
        const d = new Date(date);
        return !isNaN(d.getTime());
      }, "Completion date must be a valid date in ISO format")
      .optional(),

    requiredTransportType: TransportType,

    expectedRevenue: z
      .number()
      .positive("Expected revenue must be positive")
      .max(1000000, "Expected revenue is too high"),

    revenueCurrency: Currency.default("EUR"),

    actualRevenue: z
      .number()
      .positive("Actual revenue must be positive")
      .max(1000000, "Actual revenue is too high")
      .optional(),

    actualRevenueCurrency: Currency.optional(),

    status: RouteStatus.default("pending"),

    vehicleId: z
      .string()
      .regex(vehicleIdRegex, "Invalid vehicle ID format")
      .optional(),

    notes: z.string().max(500, "Notes cannot exceed 500 characters").optional(),
  })
  .refine(
    (data) => {
      if (data.completionDate) {
        const departure = new Date(data.departureDate);
        const completion = new Date(data.completionDate);
        return completion >= departure;
      }
      return true;
    },
    {
      message: "Completion date cannot be before departure date",
      path: ["completionDate"],
    }
  )
  .refine(
    (data) => {
      if (data.actualRevenue && !data.actualRevenueCurrency) {
        return false;
      }
      return true;
    },
    {
      message:
        "Actual revenue currency is required when actual revenue is provided",
      path: ["actualRevenueCurrency"],
    }
  );

export const updateRouteSchema = createRouteSchema
  .partial()
  .extend({
    status: RouteStatus.optional(),
    id: z.string().regex(routeIdRegex, "Invalid route ID format").optional(),
    vehicleId: z
      .string()
      .regex(vehicleIdRegex, "Invalid vehicle ID format")
      .nullable()
      .optional(),
  })
  .refine(
    (data) => {
      const { id, ...rest } = data;
      return Object.keys(rest).length > 0;
    },
    {
      message: "At least one field must be provided for update",
    }
  );

export const routeQuerySchema = z.object({
  status: RouteStatus.optional(),
  transportType: TransportType.optional(),
  limit: z.coerce.number().int().positive().max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export const assignVehicleSchema = z.object({
  vehicleId: z
    .string()
    .regex(vehicleIdRegex, "Invalid vehicle ID format")
    .nullable(),
});

export type CreateRouteDto = z.infer<typeof createRouteSchema>;
export type UpdateRouteDto = z.infer<typeof updateRouteSchema>;
export type RouteQueryDto = z.infer<typeof routeQuerySchema>;
export type AssignVehicleDto = z.infer<typeof assignVehicleSchema>;
