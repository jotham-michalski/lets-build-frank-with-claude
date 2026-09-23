import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import type { CallToolResult, Tool } from "@modelcontextprotocol/sdk/types.js";

// Relative paths only (ADR-006): the console is served by Frank at '/' and
// calls Frank's own '/mcp' and '/healthz', same-origin, no CORS, no
// build-time URL. In dev, vite.config.ts proxies both to a local Frank.
let clientPromise: Promise<Client> | undefined;

function connect(): Promise<Client> {
  if (!clientPromise) {
    clientPromise = (async () => {
      const client = new Client({ name: "frank-console", version: "0.1.0" });
      const transport = new StreamableHTTPClientTransport(
        new URL("/mcp", window.location.origin),
      );
      await client.connect(transport);
      return client;
    })();
  }
  return clientPromise;
}

export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch("/healthz");
    return response.ok;
  } catch {
    return false;
  }
}

export async function listTools(): Promise<Tool[]> {
  const client = await connect();
  const { tools } = await client.listTools();
  return tools;
}

export async function callTool(
  name: string,
  args: Record<string, unknown>,
): Promise<CallToolResult> {
  const client = await connect();
  return client.callTool({ name, arguments: args }) as Promise<CallToolResult>;
}
