import { existsSync } from "node:fs";
import path from "node:path";
import express, { type Request, type Response } from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { config } from "./config.js";
import { registerTools } from "./tools/index.js";

function createMcpServer(): McpServer {
  const server = new McpServer({ name: "frank", version: config.version });
  registerTools(server);
  return server;
}

const methodNotAllowed = (_req: Request, res: Response) => {
  res.status(405).json({
    jsonrpc: "2.0",
    error: { code: -32000, message: "Method not allowed." },
    id: null,
  });
};

export function createApp() {
  const app = express();

  // Health probe for Azure Container Apps (ADR-001, ADR-004). Plain and
  // unauthenticated, no MCP involved.
  app.get("/healthz", (_req, res) => {
    res.status(200).send("ok");
  });

  // Stateless Streamable HTTP: a fresh server+transport per request, no
  // session bookkeeping. `express.json()` is scoped to this route only, and
  // its parsed result is handed to `handleRequest` explicitly, so the SDK
  // never has to (and never tries to) re-read a consumed request stream.
  app.post("/mcp", express.json(), async (req, res) => {
    const server = createMcpServer();
    try {
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
      });
      res.on("close", () => {
        transport.close();
        server.close();
      });
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      console.error("Error handling MCP request:", error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: "2.0",
          error: { code: -32603, message: "Internal server error" },
          id: null,
        });
      }
    }
  });
  app.get("/mcp", methodNotAllowed);
  app.delete("/mcp", methodNotAllowed);

  // The console (ADR-003/ADR-006): served from ./public, which the root
  // Dockerfile populates from ui/dist. ui/ is optional — if it hasn't been
  // built yet, say so instead of 404ing.
  const indexHtmlPath = path.join(config.consoleDir, "index.html");
  if (existsSync(indexHtmlPath)) {
    app.use(express.static(config.consoleDir));
    app.get("*", (_req, res) => {
      res.sendFile(indexHtmlPath);
    });
  } else {
    app.get("/", (_req, res) => {
      res
        .status(200)
        .type("text/plain")
        .send(
          "Frank is running, but the console (ui/) hasn't been built yet. " +
            "MCP is live at POST /mcp.",
        );
    });
  }

  return app;
}
