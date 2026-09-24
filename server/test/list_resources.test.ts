import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// config.ts reads AZURE_SUBSCRIPTION_ID/AZURE_RESOURCE_GROUP once at module
// import, not lazily — so each case here resets the module graph and
// dynamically re-imports config + list_resources after setting env vars,
// rather than sharing one static import across differing env states. That
// includes `define.js`/`ToolError`: a static top-level import of it would be
// a different class instance than the one list_resources.js picks up after
// the reset, and `instanceof` would fail between them despite an identical
// error shape — so ToolError is imported fresh in the same reset cycle too.

vi.mock("@azure/identity", () => ({
  DefaultAzureCredential: class {},
}));

vi.mock("@azure/arm-resources", () => ({
  ResourceManagementClient: class {
    resources = {
      listByResourceGroup: async function* () {
        yield { name: "frank-jmichalski", type: "Microsoft.App/containerApps", location: "eastus" };
        yield { name: undefined, type: undefined, location: undefined };
      },
    };
  },
}));

const AZURE_KEYS = ["AZURE_SUBSCRIPTION_ID", "AZURE_RESOURCE_GROUP"] as const;
let originalEnv: Record<string, string | undefined>;

beforeEach(() => {
  originalEnv = Object.fromEntries(AZURE_KEYS.map((key) => [key, process.env[key]]));
});

afterEach(() => {
  for (const key of AZURE_KEYS) {
    if (originalEnv[key] === undefined) delete process.env[key];
    else process.env[key] = originalEnv[key];
  }
  vi.resetModules();
});

describe("list_resources", () => {
  it("fails closed when Azure isn't configured", async () => {
    delete process.env.AZURE_SUBSCRIPTION_ID;
    delete process.env.AZURE_RESOURCE_GROUP;
    vi.resetModules();

    const { ToolError } = await import("../src/tools/define.js");
    const { listResources } = await import("../src/tools/list_resources.js");

    await expect(listResources.handler({})).rejects.toThrow(ToolError);
    await expect(listResources.handler({})).rejects.toThrow(
      "Frank isn't configured to read Azure yet.",
    );
  });

  it("returns a summary and typed resources when configured", async () => {
    process.env.AZURE_SUBSCRIPTION_ID = "test-subscription";
    process.env.AZURE_RESOURCE_GROUP = "rg-frank-class";
    vi.resetModules();

    const { listResources } = await import("../src/tools/list_resources.js");
    const output = await listResources.handler({});

    expect(output.summary).toEqual(expect.any(String));
    expect(output.resourceGroup).toBe("rg-frank-class");
    expect(output.resources).toEqual([
      { name: "frank-jmichalski", type: "Microsoft.App/containerApps", location: "eastus" },
      { name: "unknown", type: "unknown", location: "unknown" },
    ]);
  });
});
