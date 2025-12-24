# Transport System Management

Node/Express service that talks to DynamoDB. Designed for local development with a Dockerized DynamoDB Local and environment-driven configuration.

## Features
- Route/vehicle management with validation; routes store revenue and converted amounts (EUR/USD/UAH) at vehicle assignment using Fixer.io rates.
- DynamoDB tables provisioned via scripts (`Routes`, `Vehicles`) with GSIs; seeded sample data for quick start.
- All endpoints are private: API key required on requests (`X-API-Key`).
- Postman collection for every endpoint: `postman/transport-system-management.postman_collection.json`.
- Swagger/OpenAPI documentation available at `/docs`; auto-generated spec in `src/docs/swagger.ts`.
- Uses DynamoDB (NoSQL) for persistence; scripts provision GSIs for status/transportType/vehicle lookups.
- Route distance calculations can integrate OSRM client; currency conversion via Fixer.io.
- Written in TypeScript end-to-end (app, scripts, tests).

## Prerequisites
- Node 20+ and npm
- Docker + Docker Compose

## Environment
1) Copy the template and fill in values (dummy AWS creds are fine for DynamoDB Local):
   ```sh
   cp .env.example .env.local
   ```
2) For local dev, `.env.local` is loaded automatically. Keys:
   - `DB_PROVIDER=dynamodb`
   - `AWS_REGION` (e.g. `eu-central-1`)
   - `AWS_DYNAMODB_ENDPOINT` (for local: `http://localhost:8000`)
   - `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` (any non-empty strings for local)
   - `FIXER_API_KEY`, `API_KEY` (app-level keys)
3) Stage-specific files like `.env.dev` are picked up when `STAGE=dev` is set; production relies on real environment variables passed by the platform (no files loaded in Lambda unless you override `DOTENV_CONFIG_PATH`).

## Setup & Local Run
```sh
npm install
docker compose up -d  # starts DynamoDB Local on :8000
npm run dev           # starts the API on :3000 by default
```

## Initialize DynamoDB Local
With the Docker container running:
```sh
npm run create-tables:ts  # creates Routes and Vehicles tables
npm run seed-tables:ts    # seeds sample data
```
Tables are idempotent (scripts skip existing tables); seeds generate vehicles/routes with varied statuses and transport types.

## Seed via deployed API (Lambda)
If you want to seed a deployed environment through the API (requires working Fixer and API key):
```sh
API_BASE_URL="https://your-api.example.com" API_KEY="your-key" npm run seed-api:ts
```
This script (`scripts/seed.api.ts`) uses the public endpoints to create vehicles/routes and assigns some vehicles to routes so revenue conversions are stored.

## Serverless Offline
Optional: run the Lambda handler locally with Serverless.
```sh
npx serverless offline --stage local
```
`serverless-dotenv-plugin` loads `.env.dev` for `--stage dev`; override with `--stage local` or set `DOTENV_CONFIG_PATH` if needed.

## Useful Scripts
- `npm run build` - compile TypeScript
- `npm run start` - run compiled server from `dist`
- `npm run lint` / `npm run lint:fix` - lint code
- `npm test` - run unit tests for services

## Access & Security
- Requests require header `X-API-Key: $API_KEY` (set in env). Protect `/docs` via network controls or add auth if exposing beyond local.
- Default CORS is enabled; tighten allowed origins if serving from specific frontends only.
- Set reasonable env values for `FIXER_API_KEY` to enable currency conversion.

## Postman
Import `postman/transport-system-management.postman_collection.json` to call all available endpoints (health, routes, vehicles). Set the `X-API-Key` variable in the collection or environment.

## Troubleshooting
- If the API cannot reach DynamoDB, ensure Docker is running and `AWS_DYNAMODB_ENDPOINT` points to `http://localhost:8000`.
- Delete `docker/dynamodb` data if you need a clean local database state.
