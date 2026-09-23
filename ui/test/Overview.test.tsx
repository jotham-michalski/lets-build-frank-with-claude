import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Overview } from "../src/pages/Overview.js";

vi.mock("../src/api/frank.js", () => ({
  checkHealth: vi.fn().mockResolvedValue(true),
  callTool: vi.fn().mockResolvedValue({
    isError: false,
    content: [],
    structuredContent: {
      summary: "Frank v0.1.0 has been up for 42s.",
      version: "0.1.0",
      uptimeSeconds: 42,
      greeting: "Hello from Frank!",
    },
  }),
}));

describe("Overview", () => {
  it("renders health and the get_status result", async () => {
    render(<Overview />);

    expect(await screen.findByText("Frank is reachable")).toBeInTheDocument();
    expect(
      await screen.findByText("Frank v0.1.0 has been up for 42s."),
    ).toBeInTheDocument();
    expect(screen.getByText("Hello from Frank!")).toBeInTheDocument();
  });
});
