import * as React from "react";
import { cn } from "../../lib/utils";

interface PageLayoutProps {
  sidebar?: React.ReactNode;
  header?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function PageLayout({
  sidebar,
  header,
  children,
  className,
}: PageLayoutProps) {
  return (
    <div
      className={cn(className)}
      style={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        backgroundColor: "var(--color-bg-primary)",
      }}
    >
      {/* Left sidebar — full height, fixed width */}
      {sidebar && (
        <div
          style={{
            flexShrink: 0,
            width: 220,
            height: "100vh",
            display: "flex",
            flexDirection: "column",
            borderRight: "1px solid var(--color-border-default)",
            backgroundColor: "var(--color-bg-secondary)",
            overflow: "hidden",
          }}
        >
          {sidebar}
        </div>
      )}

      {/* Right content column */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          overflow: "hidden",
        }}
      >
        {header && (
          <div
            style={{
              flexShrink: 0,
              height: 40,
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              padding: "0 16px",
              gap: 8,
              borderBottom: "1px solid var(--color-border-default)",
              backgroundColor: "var(--color-bg-secondary)",
            }}
          >
            {header}
          </div>
        )}
        <div style={{ flex: 1, overflowY: "auto", padding: 24, minWidth: 0 }}>
          <div style={{ maxWidth: 1600, margin: "0 auto" }}>{children}</div>
        </div>
      </div>
    </div>
  );
}
