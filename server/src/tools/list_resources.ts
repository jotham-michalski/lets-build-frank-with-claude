import { DefaultAzureCredential } from "@azure/identity";
import { ResourceManagementClient } from "@azure/arm-resources";
import { z } from "zod";
import { config } from "../config.js";
import { defineTool, ToolError } from "./define.js";

export const listResources = defineTool({
  name: "list_resources",
  description:
    "Lists the Azure resources in the classroom resource group Frank runs " +
    "in — name, type, and location for each. Use this to answer what is " +
    "currently deployed. Fails with a plain-language error if Frank isn't " +
    "configured to read Azure, or if Azure can't be reached.",
  inputSchema: z.object({}).strict(),
  handler: async () => {
    const { azureSubscriptionId, azureResourceGroup } = config;
    if (!azureSubscriptionId || !azureResourceGroup) {
      throw new ToolError("Frank isn't configured to read Azure yet.");
    }

    const client = new ResourceManagementClient(
      new DefaultAzureCredential(),
      azureSubscriptionId,
    );

    const resources: { name: string; type: string; location: string }[] = [];
    try {
      for await (const resource of client.resources.listByResourceGroup(
        azureResourceGroup,
      )) {
        resources.push({
          name: resource.name ?? "unknown",
          type: resource.type ?? "unknown",
          location: resource.location ?? "unknown",
        });
      }
    } catch {
      throw new ToolError("Frank couldn't read his resource group right now.");
    }

    return {
      summary: `${resources.length} resource(s) in ${azureResourceGroup}.`,
      resourceGroup: azureResourceGroup,
      resources,
    };
  },
});
