/**
 * Lifecycle and route-mapping types for the unified navigation shell.
 */

export type LifecycleStage = "acquire" | "build" | "promote" | "run" | "execute" | "observe" | "manage" | "report";

export type DomainLane = "data" | "ml" | "strategy" | "execution" | "capital" | "compliance";

export interface RouteMapping {
  path: string;
  label: string;
  primaryStage: LifecycleStage;
  secondaryStage?: LifecycleStage;
  lanes: DomainLane[];
  description?: string;
  requiresAuth?: boolean;
}

export interface LifecycleNavItem {
  stage: LifecycleStage;
  label: string;
  icon: string;
  color: string;
  items: {
    path: string;
    label: string;
    lanes: DomainLane[];
    description?: string;
  }[];
}
