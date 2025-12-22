import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { v4 as uuidv4 } from "uuid";
import * as dotenv from "dotenv";
dotenv.config();

interface Coordinate {
  lat: number;
  lng: number;
  address?: string;
}

interface RouteSeed {
  id: string;
  startPoint: Coordinate;
  endPoint: Coordinate;
  departureDate: string;
  completionDate?: string;
  requiredTransportType: string;
  expectedRevenue: number;
  revenueCurrency: string;
  status: string;
  vehicleId?: string;
  actualRevenue?: number;
  actualRevenueCurrency?: string;
  createdAt: string;
  updatedAt: string;
}

interface VehicleSeed {
  id: string;
  licensePlate: string;
  model: string;
  transportType: string;
  status: string;
  pricePerKmEUR: number;
  currentRouteId?: string;
  assigned: "available" | "assigned";
  purchaseDate?: string;
  createdAt: string;
  updatedAt: string;
}

const dynamoDBClient = new DynamoDBClient({
  region: process.env.AWS_REGION || "eu-central-1",
  endpoint: process.env.AWS_DYNAMODB_ENDPOINT,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "local-dummy-key",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "local-dummy-secret",
  },
});

const ROUTES_TABLE = "Routes";
const VEHICLES_TABLE = "Vehicles";

const generateVehicles = (count: number): VehicleSeed[] => {
  const vehicles: VehicleSeed[] = [];

  const modelsByType = {
    truck: ["Mercedes", "Scania R-series"],
    van: ["Mercedes Sprinter", "Ford Transit"],
    car: ["Volkswagen Golf", "Honda Civic"],
    refrigerated: ["Daikin", "Zanotti"],
  };

  const transportTypes = ["truck", "van", "car", "refrigerated"] as const;

  type TransportType = (typeof transportTypes)[number];

  const getRandomTransportType = (): TransportType => {
    return transportTypes[Math.floor(Math.random() * transportTypes.length)];
  };

  const generateLicensePlate = () => {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numbers = "0123456789";

    const city = letters.charAt(Math.floor(Math.random() * letters.length));
    const letter1 = letters.charAt(Math.floor(Math.random() * letters.length));
    const letter2 = letters.charAt(Math.floor(Math.random() * letters.length));
    const num1 = numbers.charAt(Math.floor(Math.random() * numbers.length));
    const num2 = numbers.charAt(Math.floor(Math.random() * numbers.length));
    const num3 = numbers.charAt(Math.floor(Math.random() * numbers.length));
    const num4 = numbers.charAt(Math.floor(Math.random() * numbers.length));

    return `${city}-${letter1}${letter2} ${num1}${num2}${num3}${num4}`;
  };

  for (let i = 0; i < count; i++) {
    const statuses = ["available", "assigned"] as const;

    type AssignmentStatus = (typeof statuses)[number];

    const status: AssignmentStatus =
      statuses[Math.floor(Math.random() * statuses.length)];

    const transportType: TransportType = getRandomTransportType();

    const vehicle: VehicleSeed = {
      id: `vehicle-${uuidv4().substring(0, 8)}`,
      licensePlate: generateLicensePlate(),
      model:
        modelsByType[transportType][
          Math.floor(Math.random() * modelsByType[transportType].length)
        ],
      transportType,
      status,
      pricePerKmEUR: parseFloat((Math.random() * 1.5 + 0.5).toFixed(2)),
      assigned: status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    vehicles.push(vehicle);
  }

  return vehicles;
};

// Generate route data
const generateRoutes = (
  count: number,
  vehicles: VehicleSeed[]
): RouteSeed[] => {
  const routes: RouteSeed[] = [];
  const now = new Date();

  const cities = [
    { name: "Berlin", lat: 52.52, lng: 13.405 },
    { name: "Paris", lat: 48.8566, lng: 2.3522 },
    { name: "London", lat: 51.5074, lng: -0.1278 },
    { name: "Madrid", lat: 40.4168, lng: -3.7038 },
    { name: "Rome", lat: 41.9028, lng: 12.4964 },
    { name: "Amsterdam", lat: 52.3676, lng: 4.9041 },
    { name: "Vienna", lat: 48.2082, lng: 16.3738 },
    { name: "Prague", lat: 50.0755, lng: 14.4378 },
    { name: "Warsaw", lat: 52.2297, lng: 21.0122 },
    { name: "Budapest", lat: 47.4979, lng: 19.0402 },
  ];

  const availableVehicles = vehicles.filter((v) => v.status === "available");

  for (let i = 0; i < count; i++) {
    let startCity, endCity;
    do {
      startCity = cities[Math.floor(Math.random() * cities.length)];
      endCity = cities[Math.floor(Math.random() * cities.length)];
    } while (startCity.name === endCity.name);

    const departureDate = new Date(now);
    departureDate.setDate(now.getDate() + Math.floor(Math.random() * 30));

    const statusRand = Math.random();
    let status: string;
    let vehicleId: string | undefined;
    let completionDate: string | undefined;
    let actualRevenue: number | undefined;

    if (statusRand < 0.25) {
      status = "completed";
      const completion = new Date(departureDate);
      completion.setDate(
        departureDate.getDate() + Math.floor(Math.random() * 5) + 1
      );
      completionDate = completion.toISOString();
      actualRevenue = Math.round(Math.random() * 500) + 500;
    } else if (statusRand < 0.5) {
      status = "in-progress";

      const vehicle = availableVehicles.find(
        (v) => v.transportType === "truck"
      );
      if (vehicle) {
        vehicleId = vehicle.id;
      }
    } else {
      status = "pending";
    }

    const transportTypes = ["truck", "van", "car", "refrigerated"];
    const requiredTransportType =
      transportTypes[Math.floor(Math.random() * transportTypes.length)];

    const route: RouteSeed = {
      id: `route-${uuidv4().substring(0, 8)}`,
      startPoint: {
        lat: startCity.lat + (Math.random() * 0.5 - 0.25),
        lng: startCity.lng + (Math.random() * 0.5 - 0.25),
        address: `${startCity.name}, Europe`,
      },
      endPoint: {
        lat: endCity.lat + (Math.random() * 0.5 - 0.25),
        lng: endCity.lng + (Math.random() * 0.5 - 0.25),
        address: `${endCity.name}, Europe`,
      },
      departureDate: departureDate.toISOString(),
      completionDate,
      requiredTransportType,
      expectedRevenue: Math.round(Math.random() * 2000) + 500,
      revenueCurrency: "EUR",
      actualRevenue,
      actualRevenueCurrency: actualRevenue ? "EUR" : undefined,
      status,
      vehicleId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    routes.push(route);
  }

  return routes;
};

const seedData = async (vehicleCount: number = 8, routeCount: number = 15) => {
  console.log(`Seeding vehicles: ${vehicleCount}`);
  console.log(`Seeding routes: ${routeCount}\n`);

  const vehicles = generateVehicles(vehicleCount);
  const routes = generateRoutes(routeCount, vehicles);

  let vehicleSuccess = 0;
  let vehicleErrors = 0;

  for (let i = 0; i < vehicles.length; i++) {
    const vehicle = vehicles[i];

    try {
      await dynamoDBClient.send(
        new PutCommand({
          TableName: VEHICLES_TABLE,
          Item: vehicle,
        })
      );

      vehicleSuccess++;
    } catch (error: any) {
      vehicleErrors++;
      console.log(`Failed: ${error.message}`);
    }
  }

  console.log(`Seeding routes...`);
  let routeSuccess = 0;
  let routeErrors = 0;

  for (let i = 0; i < routes.length; i++) {
    const route = routes[i];

    try {
      await dynamoDBClient.send(
        new PutCommand({
          TableName: ROUTES_TABLE,
          Item: route,
        })
      );

      routeSuccess++;
    } catch (error: any) {
      routeErrors++;
      console.log(`Failed: ${error.message}`);
    }
  }
};

const vehicleCount = 8;
const routeCount = 15;

seedData(vehicleCount, routeCount).catch((error) => {
  console.error("Error:", error.message);
  process.exit(1);
});
