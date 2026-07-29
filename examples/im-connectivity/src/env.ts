import { existsSync } from "node:fs";

for (const envFile of [
  new URL("../../.env", import.meta.url),
  new URL("../.env", import.meta.url),
]) {
  if (existsSync(envFile)) {
    process.loadEnvFile(envFile);
  }
}

export function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`缺少环境变量 ${name}；请参考 .env.example 配置。`);
  }
  return value;
}

export function logEvent(platform: string, event: string, details?: unknown): void {
  const suffix = details === undefined ? "" : ` ${JSON.stringify(details)}`;
  console.log(`[${new Date().toISOString()}] [${platform}] ${event}${suffix}`);
}
