import type { Server } from "node:http";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";

// Exercises the transport the Dockerfile's HEALTHCHECK and Azure Container
// Apps' probing actually depend on — tool unit tests alone don't prove this.
describe("HTTP surface", () => {
  let server: Server;
  let baseUrl: URL;

  beforeAll(async () => {
    const app = createApp();
    server = app.listen(0);
    await new Promise<void>((resolve) => server.once("listening", resolve));
    const address = server.address();
    if (address === null || typeof address === "string") {
      throw new Error("expected a network address");
    }
    baseUrl = new URL(`http://127.0.0.1:${address.port}`);
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  });

  it("GET /healthz returns 200", async () => {
    const response = await fetch(new URL("/healthz", baseUrl));
    expect(response.status).toBe(200);
  });

  it("serves MCP over POST /mcp: initialize, list tools, call get_status", async () => {
    const client = new Client({ name: "frank-http-test", version: "0.0.0" });
    const transport = new StreamableHTTPClientTransport(
      new URL("/mcp", baseUrl),
    );

    await client.connect(transport);

    const { tools } = await client.listTools();
    expect(tools.some((tool) => tool.name === "get_status")).toBe(true);

    const result = await client.callTool({
      name: "get_status",
      arguments: {},
    });
    expect(result.isError).not.toBe(true);
    expect(result.structuredContent).toMatchObject({
      summary: expect.any(String),
    });

    await client.close();
  });
});
