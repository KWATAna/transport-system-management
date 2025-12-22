import { z } from "zod";

const vehicleStatuses = ["available", "assigned"] as const;

const transportTypes = ["truck", "van", "car", "refrigerated"] as const;

export const createVehicleSchema = z.object({
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
  assigned: z.boolean().default(false),
});
