import { describe, expect, it } from "vitest";
import { getStatus } from "../src/tools/get_status.js";

describe("get_status", () => {
  it("returns a summary, version, uptime, and greeting", async () => {
    const result = await getStatus.handler({});

    expect(result.summary).toEqual(expect.any(String));
    expect(result.version).toEqual(expect.any(String));
    expect(result.uptimeSeconds).toBeGreaterThanOrEqual(0);
    expect(result.greeting).toEqual(expect.any(String));
  });

  it("rejects unknown input fields", () => {
    const parsed = getStatus.inputSchema.safeParse({ nonsense: true });
    expect(parsed.success).toBe(false);
  });
});
