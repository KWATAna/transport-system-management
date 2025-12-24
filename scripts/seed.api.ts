import axios from "axios";
import fs from "fs";
import path from "path";
import * as dotenv from "dotenv";

const cwd = process.cwd();
const explicitEnvPath = process.env.DOTENV_CONFIG_PATH;
const localEnvPath = path.join(cwd, ".env.local");
const defaultEnvPath = path.join(cwd, ".env");
const envPath =
  explicitEnvPath ||
  (fs.existsSync(localEnvPath)
    ? localEnvPath
    : fs.existsSync(defaultEnvPath)
    ? defaultEnvPath
    : undefined);

if (envPath) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

console.log(process.env);
const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3000";
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error(
    "API_KEY is required to seed via API. Set it in your environment."
  );
}

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "X-API-Key": API_KEY,
    "Content-Type": "application/json",
  },
});

type SeedVehicle = {
  model: string;
  licensePlate: string;
  transportType: string;
  pricePerKmEUR: number;
  status?: string;
  purchaseDate?: string;
};

type SeedRoute = {
  startPoint: { lat: number; lng: number };
  endPoint: { lat: number; lng: number };
  requiredTransportType: string;
  expectedRevenue: number;
};

const vehicles: SeedVehicle[] = [
  {
    model: "Mercedes Actros",
    licensePlate: "API-TRK-001",
    transportType: "truck",
    pricePerKmEUR: 1.2,
    status: "available",
    purchaseDate: new Date("2023-01-10").toISOString(),
  },
  {
    model: "Ford Transit",
    licensePlate: "API-VAN-002",
    transportType: "van",
    pricePerKmEUR: 0.9,
    status: "available",
    purchaseDate: new Date("2022-05-18").toISOString(),
  },
  {
    model: "VW Crafter",
    licensePlate: "API-VAN-003",
    transportType: "van",
    pricePerKmEUR: 0.95,
    status: "available",
    purchaseDate: new Date("2022-08-01").toISOString(),
  },
  {
    model: "Toyota Corolla",
    licensePlate: "API-CAR-004",
    transportType: "car",
    pricePerKmEUR: 0.7,
    status: "available",
    purchaseDate: new Date("2024-02-10").toISOString(),
  },
];

const routes: SeedRoute[] = [
  {
    startPoint: { lat: 52.52, lng: 13.405 },
    endPoint: { lat: 50.0755, lng: 14.4378 },
    requiredTransportType: "truck",
    expectedRevenue: 1500,
  },
  {
    startPoint: { lat: 51.5074, lng: -0.1278 },
    endPoint: { lat: 48.8566, lng: 2.3522 },
    requiredTransportType: "van",
    expectedRevenue: 950,
  },
  {
    startPoint: { lat: 40.4168, lng: -3.7038 },
    endPoint: { lat: 41.9028, lng: 12.4964 },
    requiredTransportType: "van",
    expectedRevenue: 1200,
  },
];

const futureDate = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
};

async function seedVehicles(): Promise<string[]> {
  const ids: string[] = [];
  for (const vehicle of vehicles) {
    try {
      const { data } = await client.post("/api/vehicles/create", vehicle);
      ids.push(data.data.id);
      console.log(`Created vehicle ${data.data.id} (${vehicle.licensePlate})`);
    } catch (error: any) {
      console.error(
        "Failed to create vehicle",
        vehicle.licensePlate,
        error.response?.data || error.message
      );
    }
  }
  return ids;
}

async function seedRoutes(): Promise<string[]> {
  const ids: string[] = [];
  for (const route of routes) {
    const payload = {
      ...route,
      departureDate: futureDate(3),
      revenueCurrency: "EUR",
    };
    try {
      const { data } = await client.post("/api/routes/create", payload);
      ids.push(data.data.id);
      console.log(
        `Created route ${data.data.id} (${route.requiredTransportType})`
      );
    } catch (error: any) {
      console.error(
        "Failed to create route",
        route.requiredTransportType,
        error.response?.data || error.message
      );
    }
  }
  return ids;
}

async function main() {
  console.log(`Seeding via API at ${API_BASE_URL}`);
  const vehicleIds = await seedVehicles();
  const routeIds = await seedRoutes();

  if (!vehicleIds.length || !routeIds.length) {
    console.warn(
      "Skipping assignments because vehicles or routes were not created."
    );
  }
}

main().catch((err) => {
  console.error("Seeding failed", err);
  process.exit(1);
});
