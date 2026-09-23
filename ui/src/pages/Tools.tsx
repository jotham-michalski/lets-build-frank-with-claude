import ColumnLayout from "@cloudscape-design/components/column-layout";
import Container from "@cloudscape-design/components/container";
import Header from "@cloudscape-design/components/header";
import SpaceBetween from "@cloudscape-design/components/space-between";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import Table from "@cloudscape-design/components/table";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { useEffect, useState } from "react";
import { listTools } from "../api/frank.js";
import { ToolForm } from "../components/ToolForm.js";

export function Tools() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [selected, setSelected] = useState<Tool | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listTools()
      .then(setTools)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : String(err));
      });
  }, []);

  return (
    <SpaceBetween size="l">
      <Header variant="h1" counter={`(${tools.length})`}>
        Tools
      </Header>
      {error && <StatusIndicator type="error">{error}</StatusIndicator>}
      <ColumnLayout columns={2}>
        <Table<Tool>
          columnDefinitions={[
            { id: "name", header: "Name", cell: (item) => item.name },
            {
              id: "description",
              header: "Description",
              cell: (item) => item.description ?? "",
            },
          ]}
          items={tools}
          trackBy="name"
          selectionType="single"
          selectedItems={selected ? [selected] : []}
          onSelectionChange={({ detail }) =>
            setSelected(detail.selectedItems[0] ?? null)
          }
          empty="No tools discovered yet."
        />
        <Container
          header={
            <Header variant="h2">{selected ? selected.name : "Select a tool"}</Header>
          }
        >
          {selected ? (
            <ToolForm tool={selected} />
          ) : (
            "Select a tool on the left to call it."
          )}
        </Container>
      </ColumnLayout>
    </SpaceBetween>
  );
}
