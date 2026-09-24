import { z } from "zod";

// ADR-002's closed verb set. `create_*`, `update_*`, `delete_*`, `run_*` are
// out of policy — a genuine need for one requires an ADR superseding ADR-002,
// not a new tool.
const NAME_PATTERN = /^(get|list|search|summarize)_[a-z0-9]+(?:_[a-z0-9]+)*$/;

export interface ToolOutput {
  /** Human/model-readable summary. Every tool output has one. */
  summary: string;
  [key: string]: unknown;
}

/**
 * A handler throws this, and only this, with a message already written in
 * plain language for whoever calls the tool. The MCP SDK catches any thrown
 * error at the protocol layer and turns it into an `isError` result using
 * `.message` — `ToolError` exists so that message is one a tool author wrote
 * on purpose, not whatever an underlying library happened to say (ADR-002).
 */
export class ToolError extends Error {}

export interface ToolDefinition<
  Input extends z.ZodObject<z.ZodRawShape, "strict">,
  Output extends ToolOutput,
> {
  name: string;
  description: string;
  inputSchema: Input;
  handler: (input: z.infer<Input>) => Promise<Output> | Output;
}

/**
 * Declares an MCP tool, enforcing ADR-002's naming rule at definition time and
 * its schema shape (a strict zod object, an output with a `summary` field) at
 * the type level. `server/src/tools/index.ts` registers whatever this
 * returns; nothing else needs to know these rules.
 */
export function defineTool<
  Input extends z.ZodObject<z.ZodRawShape, "strict">,
  Output extends ToolOutput,
>(definition: ToolDefinition<Input, Output>): ToolDefinition<Input, Output> {
  if (!NAME_PATTERN.test(definition.name)) {
    throw new Error(
      `Tool name "${definition.name}" violates ADR-002: names must be ` +
        `verb_noun in lower snake_case, with verb in get/list/search/summarize.`,
    );
  }
  return definition;
}
