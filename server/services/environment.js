export const required = [
  "APP_BASE_URL",
  "API_BASE_URL",
  "APP_NAME",
  "APP_PORT",
  "APP_TIER",
  "LOG_LEVEL",
  "DATA_FOLDER",
  "INPUT_FOLDER",
  "OUTPUT_FOLDER",
  "EMAIL_ADMIN",
  "EMAIL_SMTP_HOST",
  "EMAIL_SMTP_PORT",
  "VPC_ID",
  "SUBNET_IDS",
  "SECURITY_GROUP_IDS",
  "ECS_CLUSTER",
  "WORKER_TASK_NAME",
  "WORKER_TYPE",
];

export function validateEnvironment(env = process.env, vars = required) {
  for (const key of required) {
    if (!env[key]) {
      throw new Error(`Missing environment variable: ${key}.`);
    }
  }
}
