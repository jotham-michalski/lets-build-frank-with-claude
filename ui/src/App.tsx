import AppLayout from "@cloudscape-design/components/app-layout";
import SideNavigation from "@cloudscape-design/components/side-navigation";
import { useState } from "react";
import { Overview } from "./pages/Overview.js";
import { Tools } from "./pages/Tools.js";

type Page = "overview" | "tools";

const PAGES: Record<Page, { text: string; content: JSX.Element }> = {
  overview: { text: "Overview", content: <Overview /> },
  tools: { text: "Tools", content: <Tools /> },
};

export function App() {
  const [page, setPage] = useState<Page>("overview");

  return (
    <AppLayout
      navigationHide={false}
      toolsHide={true}
      navigation={
        <SideNavigation
          header={{ text: "Frank", href: "#" }}
          activeHref={`#${page}`}
          items={(Object.keys(PAGES) as Page[]).map((key) => ({
            type: "link",
            text: PAGES[key].text,
            href: `#${key}`,
          }))}
          onFollow={(event) => {
            event.preventDefault();
            const next = event.detail.href.replace("#", "") as Page;
            if (next in PAGES) setPage(next);
          }}
        />
      }
      content={PAGES[page].content}
    />
  );
}
