import { z } from "zod";

const vehicleStatuses = ["available", "assigned"] as const;

const transportTypes = ["truck", "van", "car", "refrigerated"] as const;

const vehicleIdRegex = /^vehicle-[0-9a-f]{8}$/;
const paginationSchema = {
  limit: z.coerce.number().int().positive().max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
};

export const createVehicleSchema = z.object({
  id: z.string().regex(vehicleIdRegex, "Invalid vehicle ID format").optional(),
  model: z.string().min(1, "Model cannot be empty"),

  licensePlate: z
    .string()
    .min(1, "License plate cannot be empty")
    .max(15, "License plate cannot exceed 15 characters"),

  transportType: z.enum(transportTypes),

  status: z.enum(vehicleStatuses).default("available"),

  pricePerKmEUR: z.number().positive("Price per km must be greater than 0"),
  purchaseDate: z.string().refine((date) => {
    const d = new Date(date);
    return !isNaN(d.getTime());
  }, "Completion date must be a valid date in ISO format"),
});

export const updateVehicleSchema = createVehicleSchema.partial().extend({
  currentLocation: z
    .object({
      lat: z.number(),
      lng: z.number(),
    })
    .nullable()
    .optional(),
  notes: z.string().optional(),
  fuelType: z.string().optional(),
  capacity: z.number().positive("Capacity must be greater than 0").optional(),
});

export const vehicleQuerySchema = z.object({
  status: z.enum(vehicleStatuses).optional(),
  transportType: z.enum(transportTypes).optional(),
  ...paginationSchema,
});

export type VehicleQueryDto = z.infer<typeof vehicleQuerySchema>;
