import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = path.resolve(fileURLToPath(import.meta.url), "..", "..");

const pkg = JSON.parse(
  readFileSync(path.join(packageRoot, "package.json"), "utf-8"),
) as { version: string };

export const config = {
  port: Number(process.env.PORT ?? 3000),
  version: pkg.version,
  // Matches the root Dockerfile, which copies ui/dist to /app/public.
  consoleDir: path.join(packageRoot, "public"),
  // ADR-009. Optional: unset locally and in CI, where list_resources fails
  // closed rather than the whole server refusing to boot.
  azureSubscriptionId: process.env.AZURE_SUBSCRIPTION_ID,
  azureResourceGroup: process.env.AZURE_RESOURCE_GROUP,
};
