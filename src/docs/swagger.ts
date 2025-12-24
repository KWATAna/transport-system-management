import swaggerJsdoc from "swagger-jsdoc";

const port = process.env.PORT || 3000;

const swaggerDefinition = {
  openapi: "3.0.1",
  info: {
    title: "Transport System Management API",
    version: "1.0.0",
    description:
      "REST API for managing transport routes and vehicles with DynamoDB persistence.",
  },
  servers: [
    {
      url: process.env.SWAGGER_SERVER_URL || `http://localhost:${port}`,
      description: "Current environment",
    },
  ],
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: "apiKey",
        in: "header",
        name: "X-API-Key",
        description: "API key required for protected endpoints",
      },
    },
    schemas: {
      Route: {
        type: "object",
        properties: {
          id: { type: "string", example: "route-a1b2c3d4" },
          startPoint: {
            type: "object",
            properties: {
              lat: { type: "number", example: 52.52 },
              lng: { type: "number", example: 13.405 },
              address: { type: "string", example: "Berlin, Europe" },
            },
          },
          endPoint: {
            type: "object",
            properties: {
              lat: { type: "number", example: 48.8566 },
              lng: { type: "number", example: 2.3522 },
              address: { type: "string", example: "Paris, Europe" },
            },
          },
          departureDate: {
            type: "string",
            format: "date-time",
            example: "2025-03-01T10:00:00.000Z",
          },
          completionDate: {
            type: "string",
            format: "date-time",
            nullable: true,
            example: "2025-03-04T14:00:00.000Z",
          },
          requiredTransportType: {
            type: "string",
            enum: ["truck", "van", "car", "refrigerated"],
            example: "truck",
          },
          expectedRevenue: { type: "number", example: 1250 },
          revenueCurrency: {
            type: "string",
            enum: ["EUR"],
            example: "EUR",
          },
          status: {
            type: "string",
            enum: [
              "pending",
              "assigned",
              "in-progress",
              "completed",
              "cancelled",
            ],
            example: "pending",
          },
          vehicleId: {
            type: "string",
            nullable: true,
            example: "vehicle-12ab34cd",
          },
          notes: { type: "string", nullable: true, example: "Fragile goods" },
          createdAt: {
            type: "string",
            format: "date-time",
            example: "2025-02-01T12:00:00.000Z",
          },
          updatedAt: {
            type: "string",
            format: "date-time",
            example: "2025-02-02T12:00:00.000Z",
          },
        },
      },
      RouteInput: {
        type: "object",
        required: [
          "startPoint",
          "endPoint",
          "departureDate",
          "requiredTransportType",
          "expectedRevenue",
        ],
        properties: {
          id: { type: "string", example: "route-a1b2c3d4" },
          startPoint: {
            type: "object",
            required: ["lat", "lng"],
            properties: {
              lat: { type: "number", example: 50.4501 },
              lng: { type: "number", example: 30.5234 },
              address: { type: "string", example: "Kyiv, Ukraine" },
            },
          },
          endPoint: {
            type: "object",
            required: ["lat", "lng"],
            properties: {
              lat: { type: "number", example: 52.2297 },
              lng: { type: "number", example: 21.0122 },
              address: { type: "string", example: "Warsaw, Poland" },
            },
          },
          departureDate: {
            type: "string",
            format: "date-time",
            example: "2025-04-15T08:00:00.000Z",
          },
          completionDate: {
            type: "string",
            format: "date-time",
            nullable: true,
            example: "2025-04-16T16:00:00.000Z",
          },
          requiredTransportType: {
            type: "string",
            enum: ["truck", "van", "car", "refrigerated"],
            example: "van",
          },
          expectedRevenue: { type: "number", example: 850 },
          revenueCurrency: {
            type: "string",
            enum: ["EUR"],
            example: "EUR",
          },
          status: {
            type: "string",
            enum: [
              "pending",
              "assigned",
              "in-progress",
              "completed",
              "cancelled",
            ],
            example: "pending",
          },
          vehicleId: {
            type: "string",
            nullable: true,
            example: "vehicle-9f8e7d6c",
          },
          notes: {
            type: "string",
            nullable: true,
            example: "Deliver before noon",
          },
        },
      },
      Vehicle: {
        type: "object",
        properties: {
          id: { type: "string", example: "vehicle-1a2b3c4d" },
          model: { type: "string", example: "Mercedes Sprinter" },
          licensePlate: { type: "string", example: "B-AA 1234" },
          transportType: {
            type: "string",
            enum: ["truck", "van", "car", "refrigerated"],
            example: "van",
          },
          status: {
            type: "string",
            enum: ["available", "assigned"],
            example: "available",
          },
          pricePerKmEUR: { type: "number", example: 0.9 },
          purchaseDate: {
            type: "string",
            format: "date-time",
            example: "2024-06-01T00:00:00.000Z",
          },
          currentRouteId: {
            type: "string",
            nullable: true,
            example: "route-1a2b3c4d",
          },
          createdAt: {
            type: "string",
            format: "date-time",
            example: "2024-07-01T12:00:00.000Z",
          },
          updatedAt: {
            type: "string",
            format: "date-time",
            example: "2024-07-02T12:00:00.000Z",
          },
        },
      },
      VehicleInput: {
        type: "object",
        required: [
          "model",
          "licensePlate",
          "transportType",
          "status",
          "pricePerKmEUR",
          "purchaseDate",
          "assigned",
        ],
        properties: {
          id: { type: "string", example: "vehicle-1a2b3c4d" },
          model: { type: "string", example: "Renault Master" },
          licensePlate: { type: "string", example: "K-AA 7788" },
          transportType: {
            type: "string",
            enum: ["truck", "van", "car", "refrigerated"],
            example: "truck",
          },
          status: {
            type: "string",
            enum: ["available", "assigned"],
            example: "available",
          },
          pricePerKmEUR: { type: "number", example: 1.1 },
          purchaseDate: {
            type: "string",
            format: "date-time",
            example: "2024-12-01T00:00:00.000Z",
          },
        },
      },
      ApiError: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          error: { type: "string", example: "Invalid API key" },
        },
      },
    },
  },
  paths: {
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Перевірка стану сервісу",
        responses: {
          200: {
            description: "Сервіс працює",
            content: {
              "application/json": {
                example: {
                  status: "OK",
                  timestamp: "2025-01-01T12:00:00.000Z",
                  uptime: 1234.56,
                  services: { database: "connected" },
                },
              },
            },
          },
        },
      },
    },
    "/api/routes": {
      get: {
        tags: ["Routes"],
        security: [{ ApiKeyAuth: [] }],
        summary: "Отримати всі маршрути",
        parameters: [
          {
            name: "status",
            in: "query",
            schema: {
              type: "string",
              enum: [
                "pending",
                "assigned",
                "in-progress",
                "completed",
                "cancelled",
              ],
            },
            description: "Фільтр за статусом",
          },
          {
            name: "transportType",
            in: "query",
            schema: {
              type: "string",
              enum: ["truck", "van", "car", "refrigerated"],
            },
            description: "Фільтр за типом транспорту",
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 50 },
            description: "Кількість результатів",
          },
          {
            name: "offset",
            in: "query",
            schema: { type: "integer", default: 0 },
            description: "Зміщення",
          },
        ],
        responses: {
          200: {
            description: "Список маршрутів",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Route" },
                    },
                    message: { type: "string" },
                  },
                },
                example: {
                  success: true,
                  message: "Routes retrieved successfully",
                  data: [
                    {
                      id: "route-a1b2c3d4",
                      startPoint: {
                        lat: 50.45,
                        lng: 30.52,
                        address: "Kyiv, Ukraine",
                      },
                      endPoint: {
                        lat: 52.23,
                        lng: 21.01,
                        address: "Warsaw, Poland",
                      },
                      departureDate: "2025-04-15T08:00:00.000Z",
                      requiredTransportType: "truck",
                      expectedRevenue: 850,
                      revenueCurrency: "EUR",
                      status: "pending",
                      vehicleId: null,
                    },
                  ],
                },
              },
            },
          },
          401: {
            description: "Невірний ключ",
            content: {
              "application/json": { $ref: "#/components/schemas/ApiError" },
            },
          },
        },
      },
    },
    "/api/routes/{id}": {
      get: {
        tags: ["Routes"],
        security: [{ ApiKeyAuth: [] }],
        summary: "Отримати маршрут за ID",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", example: "route-a1b2c3d4" },
          },
        ],
        responses: {
          200: {
            description: "Маршрут",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: { $ref: "#/components/schemas/Route" },
                    message: { type: "string" },
                  },
                },
                example: {
                  success: true,
                  message: "Route retrieved successfully",
                  data: {
                    id: "route-a1b2c3d4",
                    startPoint: { lat: 50.45, lng: 30.52, address: "Kyiv" },
                    endPoint: { lat: 52.23, lng: 21.01, address: "Warsaw" },
                    departureDate: "2025-04-15T08:00:00.000Z",
                    requiredTransportType: "truck",
                    expectedRevenue: 850,
                    revenueCurrency: "EUR",
                    status: "pending",
                  },
                },
              },
            },
          },
          404: {
            description: "Не знайдено",
            content: {
              "application/json": { $ref: "#/components/schemas/ApiError" },
            },
          },
        },
      },
      put: {
        tags: ["Routes"],
        security: [{ ApiKeyAuth: [] }],
        summary: "Оновити маршрут",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", example: "route-a1b2c3d4" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RouteInput" },
              examples: {
                updateStatus: {
                  summary: "Зміна статусу маршруту",
                  value: {
                    status: "in-progress"
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Оновлений маршрут",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Route" },
              },
            },
          },
          404: { description: "Не знайдено" },
        },
      },
      delete: {
        tags: ["Routes"],
        security: [{ ApiKeyAuth: [] }],
        summary: "Видалити маршрут",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", example: "route-a1b2c3d4" },
          },
        ],
        responses: {
          200: {
            description: "Маршрут видалено",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Route deleted successfully",
                },
              },
            },
          },
        },
      },
    },
    "/api/routes/create": {
      post: {
        tags: ["Routes"],
        security: [{ ApiKeyAuth: [] }],
        summary: "Створити маршрут",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RouteInput" },
              examples: {
                basic: {
                  summary: "Базове створення",
                  value: {
                    startPoint: {
                      lat: 50.45,
                      lng: 30.52,
                      address: "Kyiv, Ukraine",
                    },
                    endPoint: {
                      lat: 52.23,
                      lng: 21.01,
                      address: "Warsaw, Poland",
                    },
                    departureDate: "2025-04-15T08:00:00.000Z",
                    requiredTransportType: "truck",
                    expectedRevenue: 850,
                    revenueCurrency: "EUR",
                    notes: "Deliver before noon",
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Маршрут створено",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Route" },
              },
            },
          },
        },
      },
    },
    "/api/routes/{id}/assign-vehicle": {
      put: {
        tags: ["Routes"],
        security: [{ ApiKeyAuth: [] }],
        summary: "Призначити або зняти транспорт",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", example: "route-a1b2c3d4" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  vehicleId: {
                    type: "string",
                    nullable: true,
                    example: "vehicle-1a2b3c4d",
                  },
                },
              },
              examples: {
                assign: {
                  summary: "Призначити транспорт",
                  value: { vehicleId: "vehicle-1a2b3c4d" },
                },
                unassign: {
                  summary: "Зняти транспорт",
                  value: { vehicleId: null },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Оновлений маршрут",
            content: {
              "application/json": { $ref: "#/components/schemas/Route" },
            },
          },
        },
      },
    },
    "/api/vehicles": {
      get: {
        tags: ["Vehicles"],
        security: [{ ApiKeyAuth: [] }],
        summary: "Отримати всі транспортні засоби",
        responses: {
          200: {
            description: "Список транспортних засобів",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Vehicles retrieved successfully",
                  data: [
                    {
                      id: "vehicle-1a2b3c4d",
                      model: "Mercedes Sprinter",
                      licensePlate: "B-AA 1234",
                      transportType: "van",
                      status: "available",
                      pricePerKmEUR: 0.9,
                      purchaseDate: "2024-06-01T00:00:00.000Z",
                    },
                  ],
                },
              },
            },
          },
        },
      },
    },
    "/api/vehicles/{id}": {
      get: {
        tags: ["Vehicles"],
        security: [{ ApiKeyAuth: [] }],
        summary: "Отримати транспорт за ID",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", example: "vehicle-1a2b3c4d" },
          },
        ],
        responses: {
          200: {
            description: "Транспорт",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Vehicle" },
              },
            },
          },
        },
      },
      put: {
        tags: ["Vehicles"],
        security: [{ ApiKeyAuth: [] }],
        summary: "Оновити транспорт",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", example: "vehicle-1a2b3c4d" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/VehicleInput" },
              examples: {
                updateStatus: {
                  summary: "Змінити статус",
                  value: { status: "assigned" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Оновлений транспорт",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Vehicle" },
              },
            },
          },
        },
      },
      delete: {
        tags: ["Vehicles"],
        security: [{ ApiKeyAuth: [] }],
        summary: "Видалити транспорт",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", example: "vehicle-1a2b3c4d" },
          },
        ],
        responses: {
          200: {
            description: "Транспорт видалено",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Vehicle deleted successfully",
                },
              },
            },
          },
        },
      },
    },
    "/api/vehicles/create": {
      post: {
        tags: ["Vehicles"],
        security: [{ ApiKeyAuth: [] }],
        summary: "Створити транспортний засіб",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/VehicleInput" },
              examples: {
                basic: {
                  summary: "Базове створення",
                  value: {
                    model: "Mercedes Actros",
                    licensePlate: "M-AB 9999",
                    transportType: "truck",
                    status: "available",
                    pricePerKmEUR: 1.2,
                    purchaseDate: "2024-05-01T00:00:00.000Z",
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Транспорт створено",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Vehicle" },
              },
            },
          },
        },
      },
    },
  },
};

export const swaggerSpec = swaggerJsdoc({
  definition: swaggerDefinition,
  apis: [],
});
