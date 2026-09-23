import { z } from "zod";
import { config } from "../config.js";
import { defineTool } from "./define.js";

const startedAt = Date.now();

export const getStatus = defineTool({
  name: "get_status",
  description:
    "Returns Frank's version, how long he has been running, and a greeting. " +
    "Use this to check that Frank is alive and to prove the client wiring " +
    "before calling any other tool.",
  inputSchema: z.object({}).strict(),
  handler: () => {
    const uptimeSeconds = Math.floor((Date.now() - startedAt) / 1000);
    return {
      summary: `Frank v${config.version} has been up for ${uptimeSeconds}s.`,
      version: config.version,
      uptimeSeconds,
      greeting: "Hello from Frank!",
    };
  },
});
