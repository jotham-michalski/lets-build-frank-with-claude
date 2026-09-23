import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getStatus } from "./get_status.js";
import type { ToolDefinition, ToolOutput } from "./define.js";
import type { z } from "zod";

// One entry per tool. Add new tools here as they're built.
export const tools: ToolDefinition<
  z.ZodObject<z.ZodRawShape, "strict">,
  ToolOutput
>[] = [getStatus];

/** Registers every tool in `tools` on the given MCP server instance. */
export function registerTools(server: McpServer): void {
  for (const tool of tools) {
    server.registerTool(
      tool.name,
      { description: tool.description, inputSchema: tool.inputSchema },
      async (args) => {
        const output = await tool.handler(args);
        return {
          content: [{ type: "text" as const, text: JSON.stringify(output) }],
          structuredContent: output,
        };
      },
    );
  }
}
