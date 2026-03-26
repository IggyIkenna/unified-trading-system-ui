import { Target } from "lucide-react";

export function NoStrategySelected() {
  return (
    <div className="text-center py-16 text-muted-foreground">
      <Target className="size-10 mx-auto mb-3 opacity-30" />
      <p className="text-sm font-medium">No strategy selected</p>
      <p className="text-xs mt-1">
        Select a strategy from the Pipeline tab to review its promotion stages
      </p>
    </div>
  );
}
