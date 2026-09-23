import { readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { tools } from "../src/tools/index.js";

// Mirrors .claude/agents/tool-conventions.md's checklist so the automated
// gate and the haiku reviewer agent never disagree about what's in policy.
const NAME_PATTERN = /^(get|list|search|summarize)_[a-z0-9]+(?:_[a-z0-9]+)*$/;

const toolsDir = path.resolve(fileURLToPath(import.meta.url), "..", "..", "src", "tools");
const testDir = path.resolve(fileURLToPath(import.meta.url), "..");

describe("ADR-002 tool conventions", () => {
  it("registers exactly the tool modules present in src/tools/", () => {
    const moduleFiles = readdirSync(toolsDir).filter(
      (file) => file.endsWith(".ts") && !["define.ts", "index.ts"].includes(file),
    );
    expect(moduleFiles.length).toBe(tools.length);
  });

  it.each(tools)("$name: named verb_noun from the closed verb set", (tool) => {
    expect(tool.name).toMatch(NAME_PATTERN);
  });

  it.each(tools)("$name: has a description written for a model", (tool) => {
    expect(tool.description.length).toBeGreaterThan(0);
  });

  it.each(tools)("$name: input schema is a strict zod object", (tool) => {
    expect(tool.inputSchema._def.unknownKeys).toBe("strict");
  });

  it.each(tools)("$name: output has a summary plus typed fields", async (tool) => {
    // Only tools with no required input can be invoked generically here;
    // tools that require arguments are covered by their own test file.
    const parsedEmptyInput = tool.inputSchema.safeParse({});
    if (!parsedEmptyInput.success) return;

    const output = await tool.handler(parsedEmptyInput.data);
    expect(output.summary).toEqual(expect.any(String));
    expect(Object.keys(output).length).toBeGreaterThan(1);
  });

  it.each(tools)("$name: has a corresponding test file", (tool) => {
    const testFiles = readdirSync(testDir);
    expect(testFiles).toContain(`${tool.name}.test.ts`);
  });
});
