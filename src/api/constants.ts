export const ROUTE_STATUSES = {
  PENDING: "pending",
  IN_PROGRESS: "in-progress",
  COMPLETED: "completed",
} as const;

export type RouteStatus = (typeof ROUTE_STATUSES)[keyof typeof ROUTE_STATUSES];

export const VEHICLE_STATUSES = {
  AVAILABLE: "available",
  ASSIGNED: "assigned",
} as const;

export type VehicleStatus =
  (typeof VEHICLE_STATUSES)[keyof typeof VEHICLE_STATUSES];

export const CURRENCIES = {
  EUR: "EUR",
  USD: "USD",
  UAH: "UAH",
};

export const Tables = {
  VEHICLES: "Vehicles",
  ROUTES: "Routes",
};
