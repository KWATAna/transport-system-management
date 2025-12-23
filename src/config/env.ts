import fs from "fs";
import path from "path";
import { config } from "dotenv";

const cwd = process.cwd();
const explicitPath = process.env.DOTENV_CONFIG_PATH?.trim();
const stage = process.env.STAGE || process.env.NODE_ENV;
const stageEnvPath = stage ? path.join(cwd, `.env.${stage}`) : null;
const localEnvPath = path.join(cwd, ".env.local");
const defaultEnvPath = path.join(cwd, ".env");

// Avoid overriding AWS-provided env vars inside Lambda unless explicitly requested.
const isAwsRuntime =
  Boolean(process.env.LAMBDA_TASK_ROOT) || Boolean(process.env.AWS_EXECUTION_ENV);

let selectedEnvPath: string | null = null;

if (explicitPath) {
  selectedEnvPath = path.resolve(cwd, explicitPath);
} else if (!isAwsRuntime) {
  if (stageEnvPath && fs.existsSync(stageEnvPath)) {
    selectedEnvPath = stageEnvPath;
  } else if (fs.existsSync(localEnvPath)) {
    selectedEnvPath = localEnvPath;
  } else if (fs.existsSync(defaultEnvPath)) {
    selectedEnvPath = defaultEnvPath;
  }
}

if (selectedEnvPath) {
  config({ path: selectedEnvPath });
}

export const loadedEnvFile = selectedEnvPath;
