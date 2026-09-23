import Container from "@cloudscape-design/components/container";
import Header from "@cloudscape-design/components/header";
import KeyValuePairs from "@cloudscape-design/components/key-value-pairs";
import SpaceBetween from "@cloudscape-design/components/space-between";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import { useEffect, useState } from "react";
import { callTool, checkHealth } from "../api/frank.js";

interface StatusResult {
  summary: string;
  version: string;
  uptimeSeconds: number;
  greeting: string;
}

function textFromResult(result: {
  content?: Array<{ type: string; text?: string }>;
}): string {
  const first = result.content?.find((block) => block.type === "text");
  return first?.text ?? "Unknown error";
}

export function Overview() {
  const [healthy, setHealthy] = useState<boolean | null>(null);
  const [status, setStatus] = useState<StatusResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void checkHealth().then((ok) => {
      if (!cancelled) setHealthy(ok);
    });

    callTool("get_status", {})
      .then((result) => {
        if (cancelled) return;
        if (result.isError) {
          setError(textFromResult(result));
        } else {
          setStatus(result.structuredContent as unknown as StatusResult);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <SpaceBetween size="l">
      <Header variant="h1">Overview</Header>

      <Container header={<Header variant="h2">Connection health</Header>}>
        <StatusIndicator
          type={healthy === null ? "loading" : healthy ? "success" : "error"}
        >
          {healthy === null
            ? "Checking..."
            : healthy
              ? "Frank is reachable"
              : "Frank is unreachable"}
        </StatusIndicator>
      </Container>

      <Container header={<Header variant="h2">get_status</Header>}>
        {error && <StatusIndicator type="error">{error}</StatusIndicator>}
        {status && (
          <KeyValuePairs
            columns={2}
            items={[
              { label: "Summary", value: status.summary },
              { label: "Version", value: status.version },
              { label: "Uptime (s)", value: String(status.uptimeSeconds) },
              { label: "Greeting", value: status.greeting },
            ]}
          />
        )}
        {!status && !error && (
          <StatusIndicator type="loading">
            Calling get_status...
          </StatusIndicator>
        )}
      </Container>
    </SpaceBetween>
  );
}
