import * as React from "react";
import { cn } from "../../lib/utils";

export interface SidebarNavItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string;
  badgeVariant?: "success" | "error" | "warning" | "running" | "pending";
  disabled?: boolean;
}

export interface SidebarNavSection {
  id: string;
  label: string;
  items: SidebarNavItem[];
}

interface SidebarNavProps {
  sections?: SidebarNavSection[];
  items?: SidebarNavItem[];
  activeId?: string;
  onSelect?: (id: string) => void;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

const badgeDotColors: Record<string, string> = {
  success: "bg-[var(--color-success)]",
  error: "bg-[var(--color-error)]",
  warning: "bg-[var(--color-warning)]",
  running: "bg-[var(--color-running)]",
  pending: "bg-[var(--color-pending)]",
};

export function SidebarNav({
  sections,
  items,
  activeId,
  onSelect,
  header,
  footer,
  className,
}: SidebarNavProps) {
  const renderItem = (item: SidebarNavItem) => (
    <div key={item.id} style={{ display: "block", width: "100%" }}>
      <button
        type="button"
        disabled={item.disabled}
        onClick={() => !item.disabled && onSelect?.(item.id)}
        className={cn(
          "nav-item",
          activeId === item.id && "active",
          item.disabled && "opacity-40 cursor-not-allowed",
        )}
        style={{ display: "flex", width: "100%", boxSizing: "border-box" }}
      >
        {item.icon && (
          <span
            style={{
              flexShrink: 0,
              width: 16,
              height: 16,
              display: "flex",
              alignItems: "center",
            }}
          >
            {item.icon}
          </span>
        )}
        <span
          style={{
            flex: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            textAlign: "left",
          }}
        >
          {item.label}
        </span>
        {item.badge && item.badgeVariant && (
          <span
            className={cn(
              "w-1.5 h-1.5 rounded-full shrink-0",
              badgeDotColors[item.badgeVariant],
            )}
            style={{ flexShrink: 0 }}
          />
        )}
      </button>
    </div>
  );

  return (
    <nav
      className={cn("h-full w-full", className)}
      style={{ display: "flex", flexDirection: "column" }}
    >
      {header && <div style={{ flexShrink: 0 }}>{header}</div>}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          paddingTop: 8,
          paddingBottom: 8,
          display: "flex",
          flexDirection: "column",
          width: "100%",
        }}
      >
        {sections
          ? sections.map((section, idx) => (
              <div
                key={section.id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  width: "100%",
                }}
              >
                {idx > 0 && (
                  <div className="mx-4 my-1 h-px bg-[var(--color-border-subtle)]" />
                )}
                <div className="layer-heading">{section.label}</div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    width: "100%",
                    padding: "0 8px",
                  }}
                >
                  {section.items.map(renderItem)}
                </div>
              </div>
            ))
          : items && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  width: "100%",
                  padding: "0 8px",
                }}
              >
                {items.map(renderItem)}
              </div>
            )}
      </div>
      {footer && (
        <div
          className="border-t border-[var(--color-border-default)] p-3"
          style={{ flexShrink: 0 }}
        >
          {footer}
        </div>
      )}
    </nav>
  );
}
