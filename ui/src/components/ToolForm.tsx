import Box from "@cloudscape-design/components/box";
import Button from "@cloudscape-design/components/button";
import Checkbox from "@cloudscape-design/components/checkbox";
import FormField from "@cloudscape-design/components/form-field";
import Input from "@cloudscape-design/components/input";
import SpaceBetween from "@cloudscape-design/components/space-between";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { useState } from "react";
import { callTool } from "../api/frank.js";

interface JsonSchemaProperty {
  type?: string;
  description?: string;
}

interface ObjectJsonSchema {
  properties?: Record<string, JsonSchemaProperty>;
}

function coerce(raw: string, type: string | undefined): unknown {
  if (type === "number" || type === "integer") return Number(raw);
  if (type === "boolean") return raw === "true";
  return raw;
}

function textFromResult(result: {
  content?: Array<{ type: string; text?: string }>;
}): string {
  const first = result.content?.find((block) => block.type === "text");
  return first?.text ?? "Unknown error";
}

// Generic across any tool's JSON input schema (ADR-002/ADR-003): a new tool
// gets a working form with no UI code, as long as its schema is an object of
// flat string/number/boolean properties.
export function ToolForm({ tool }: { tool: Tool }) {
  const schema = tool.inputSchema as ObjectJsonSchema;
  const properties = schema.properties ?? {};
  const fieldNames = Object.keys(properties);

  const [values, setValues] = useState<Record<string, string>>({});
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);

  function setField(name: string, value: string) {
    setValues((prev) => ({ ...prev, [name]: value }));
  }

  async function run() {
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      const args: Record<string, unknown> = {};
      for (const name of fieldNames) {
        const raw = values[name];
        if (raw === undefined || raw === "") continue;
        args[name] = coerce(raw, properties[name]?.type);
      }
      const response = await callTool(tool.name, args);
      if (response.isError) {
        setError(textFromResult(response));
      } else {
        setResult(response.structuredContent ?? response.content);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setRunning(false);
    }
  }

  return (
    <SpaceBetween size="m">
      <Box color="text-body-secondary">{tool.description}</Box>

      {fieldNames.length === 0 && (
        <Box color="text-body-secondary">This tool takes no input.</Box>
      )}

      {fieldNames.map((name) => {
        const prop = properties[name];
        if (prop?.type === "boolean") {
          return (
            <Checkbox
              key={name}
              checked={values[name] === "true"}
              onChange={({ detail }) => setField(name, String(detail.checked))}
            >
              {prop.description ? `${name} — ${prop.description}` : name}
            </Checkbox>
          );
        }
        return (
          <FormField key={name} label={name} description={prop?.description}>
            <Input
              value={values[name] ?? ""}
              onChange={({ detail }) => setField(name, detail.value)}
              type={
                prop?.type === "number" || prop?.type === "integer"
                  ? "number"
                  : "text"
              }
            />
          </FormField>
        );
      })}

      <Button variant="primary" loading={running} onClick={() => void run()}>
        Call {tool.name}
      </Button>

      {error && <StatusIndicator type="error">{error}</StatusIndicator>}
      {result !== null && (
        <Box variant="code">
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </Box>
      )}
    </SpaceBetween>
  );
}
