export { cn } from "./lib/utils";

export { Badge, badgeVariants } from "./components/ui/badge";
export type { BadgeProps } from "./components/ui/badge";
export { Button, buttonVariants } from "./components/ui/button";
export type { ButtonProps } from "./components/ui/button";
export {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./components/ui/card";
export { Checkbox } from "./components/ui/checkbox";
export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from "./components/ui/dialog";
export { Input } from "./components/ui/input";
export type { InputProps } from "./components/ui/input";
export { Label } from "./components/ui/label";
export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select";
export { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
export type { TabsVariant } from "./components/ui/tabs";
export { AppHeader } from "./components/ui/header";
export { PageLayout } from "./components/ui/page-layout";
export { SidebarNav } from "./components/ui/sidebar-nav";
export type {
  SidebarNavItem,
  SidebarNavSection,
} from "./components/ui/sidebar-nav";
export { StatusDot } from "./components/ui/status-dot";

// Cloud mode indicator
export { CloudModeBadge } from "./components/ui/cloud-mode-badge";

// API connection status
export { ApiConnectionBadge } from "./components/ui/api-connection-badge";

// Mock mode
export {
  installMockHandlers,
  registerMockHandler,
  mockJson,
  mockDelay,
} from "./mock/index";
export { MockModeBanner } from "./components/ui/mock-mode-banner";

// Error boundary
export { ErrorBoundary } from "./components/ui/error-boundary";

// App shell — standard outer shell for all Unified Trading UIs
export { AppShell } from "./components/ui/app-shell";
export type { AppShellProps } from "./components/ui/app-shell";

// Deployment control
export { DeploymentPanel } from "./components/ui/deployment-panel";

// Layout helpers
export { ResponsiveGrid } from "./components/ui/responsive-grid";
export { ScrollableTable } from "./components/ui/scrollable-table";
export { CardGrid } from "./components/ui/card-grid";

// Health status
export { HealthStatusBar } from "./components/ui/health-status-bar";
export type { HealthStatusBarProps } from "./components/ui/health-status-bar";

// Cross-UI navigation
export { CrossUINav, DEFAULT_UI_GROUPS } from "./components/ui/cross-ui-nav";
export type {
  CrossUINavProps,
  CrossUINavEntry,
  CrossUINavGroup,
} from "./components/ui/cross-ui-nav";

// Config link (gear icon → onboarding-ui pages)
export { ConfigLink } from "./components/ui/config-link";
export type { ConfigLinkProps } from "./components/ui/config-link";
