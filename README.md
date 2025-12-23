# Transport System Management

Node/Express service that talks to DynamoDB. Designed for local development with a Dockerized DynamoDB Local and environment-driven configuration.

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

## Serverless Offline
Optional: run the Lambda handler locally with Serverless.
```sh
npx serverless offline --stage dev
```
`serverless-dotenv-plugin` loads `.env.dev` for `--stage dev`; override with `--stage local` or set `DOTENV_CONFIG_PATH` if needed.

## Useful Scripts
- `npm run build` - compile TypeScript
- `npm run start` - run compiled server from `dist`
- `npm run lint` / `npm run lint:fix` - lint code

## Troubleshooting
- If the API cannot reach DynamoDB, ensure Docker is running and `AWS_DYNAMODB_ENDPOINT` points to `http://localhost:8000`.
- Delete `docker/dynamodb` data if you need a clean local database state.
