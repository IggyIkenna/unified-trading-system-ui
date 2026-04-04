"use client";

// Unified Candidate Basket - shared across Strategy, ML, and Execution platforms
// Collects shortlisted candidates for promotion/review handoff

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  ShoppingBasket,
  X,
  ChevronRight,
  FileText,
  Send,
  Package,
  ExternalLink,
  Trash2,
  Plus,
  CheckCircle2,
} from "lucide-react";
import { formatNumber } from "@/lib/utils/formatters";

export interface CandidateItem {
  id: string;
  type: "strategy_config" | "model_version" | "execution_algo";
  name: string;
  version: string;
  metrics: Record<string, number>;
  note?: string;
  addedAt: string;
  addedBy?: string;
}

interface CandidateBasketProps {
  platform: "strategy" | "ml" | "execution";
  candidates: CandidateItem[];
  onRemove: (id: string) => void;
  onClearAll: () => void;
  onUpdateNote: (id: string, note: string) => void;
  onSendToReview: () => void;
  onPreparePackage: () => void;
  onOpenDeploymentReview?: () => void;
  maxCandidates?: number;
  className?: string;
}

const platformLabels = {
  strategy: { item: "Config", action: "Strategy Review" },
  ml: { item: "Model", action: "Shadow Review" },
  execution: { item: "Algo", action: "Execution Review" },
};

function CandidateCard({
  candidate,
  platform,
  onRemove,
  onUpdateNote,
}: {
  candidate: CandidateItem;
  platform: "strategy" | "ml" | "execution";
  onRemove: () => void;
  onUpdateNote: (note: string) => void;
}) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [note, setNote] = React.useState(candidate.note || "");

  return (
    <div className="p-3 rounded-lg border bg-card/50 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-medium truncate">{candidate.name}</span>
            <Badge variant="outline" className="text-[10px] font-mono">
              v{candidate.version}
            </Badge>
          </div>
          <div className="flex flex-wrap gap-2 mt-1.5">
            {Object.entries(candidate.metrics)
              .slice(0, 3)
              .map(([key, value]) => (
                <span key={key} className="text-[10px] text-muted-foreground">
                  <span className="capitalize">{key.replace(/_/g, " ")}:</span>{" "}
                  <span className="font-mono font-medium text-foreground">
                    {typeof value === "number" ? formatNumber(value, 2) : value}
                  </span>
                </span>
              ))}
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-6 text-muted-foreground hover:text-destructive"
          onClick={onRemove}
        >
          <X className="size-3.5" />
        </Button>
      </div>

      {/* Note section */}
      {isEditing ? (
        <div className="space-y-2">
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add rationale or notes..."
            className="text-xs min-h-[60px] resize-none"
          />
          <div className="flex gap-1.5">
            <Button
              size="sm"
              variant="secondary"
              className="h-6 text-xs"
              onClick={() => {
                onUpdateNote(note);
                setIsEditing(false);
              }}
            >
              Save
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 text-xs"
              onClick={() => {
                setNote(candidate.note || "");
                setIsEditing(false);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : candidate.note ? (
        <button
          className="text-xs text-muted-foreground hover:text-foreground text-left w-full"
          onClick={() => setIsEditing(true)}
        >
          <FileText className="size-3 inline mr-1" />
          {candidate.note}
        </button>
      ) : (
        <button
          className="text-xs text-muted-foreground/70 hover:text-muted-foreground flex items-center gap-1"
          onClick={() => setIsEditing(true)}
        >
          <Plus className="size-3" />
          Add note
        </button>
      )}
    </div>
  );
}

export function CandidateBasket({
  platform,
  candidates,
  onRemove,
  onClearAll,
  onUpdateNote,
  onSendToReview,
  onPreparePackage,
  onOpenDeploymentReview,
  maxCandidates = 10,
  className,
}: CandidateBasketProps) {
  const labels = platformLabels[platform];
  const isEmpty = candidates.length === 0;

  return (
    <Sheet>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <SheetTrigger asChild>
              <Button
                variant={isEmpty ? "outline" : "secondary"}
                size="sm"
                className={cn("gap-2 relative", !isEmpty && "bg-primary/10 border-primary/20 text-primary", className)}
              >
                <ShoppingBasket className="size-4 shrink-0" />
                <span className="hidden sm:inline">Candidates</span>
                {!isEmpty && (
                  <Badge
                    variant="default"
                    className="size-5 p-0 flex items-center justify-center text-[10px] absolute -top-1.5 -right-1.5"
                  >
                    {candidates.length}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {isEmpty
              ? `Select ${labels.item.toLowerCase()}s to add to basket`
              : `${candidates.length} ${labels.item.toLowerCase()}(s) selected for review`}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <SheetContent className="w-[400px] sm:w-[540px] flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBasket className="size-5" />
            Candidate Basket
            {!isEmpty && (
              <Badge variant="secondary" className="ml-auto">
                {candidates.length} / {maxCandidates}
              </Badge>
            )}
          </SheetTitle>
          <SheetDescription>
            Shortlisted {labels.item.toLowerCase()}s for promotion review. Add notes and rationale before sending to
            review.
          </SheetDescription>
        </SheetHeader>

        {isEmpty ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="size-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <ShoppingBasket className="size-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium mb-1">No candidates selected</h3>
            <p className="text-sm text-muted-foreground max-w-[280px]">
              Select {labels.item.toLowerCase()}s from the grid or comparison view to add them to your basket for
              review.
            </p>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="space-y-2 py-4">
                {candidates.map((candidate) => (
                  <CandidateCard
                    key={candidate.id}
                    candidate={candidate}
                    platform={platform}
                    onRemove={() => onRemove(candidate.id)}
                    onUpdateNote={(note) => onUpdateNote(candidate.id, note)}
                  />
                ))}
              </div>
            </ScrollArea>

            <div className="border-t pt-4 space-y-3">
              {/* Clear all */}
              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground hover:text-destructive gap-1"
                  onClick={onClearAll}
                >
                  <Trash2 className="size-3" />
                  Clear all
                </Button>
              </div>

              {/* Handoff actions - NEVER direct deploy */}
              <div className="space-y-2">
                <Button className="w-full gap-2" onClick={onSendToReview}>
                  <Send className="size-4" />
                  Send to {labels.action}
                  <ChevronRight className="size-4 ml-auto" />
                </Button>

                <Button variant="secondary" className="w-full gap-2" onClick={onPreparePackage}>
                  <Package className="size-4" />
                  Prepare Promotion Package
                </Button>

                {onOpenDeploymentReview && (
                  <Button variant="outline" className="w-full gap-2" onClick={onOpenDeploymentReview}>
                    <ExternalLink className="size-4" />
                    Open in Deployment Review
                  </Button>
                )}
              </div>

              <p className="text-[10px] text-muted-foreground text-center">
                Candidates are handed off for review. Direct deployment is not available from this workspace.
              </p>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

// Hook for managing candidate basket state
export function useCandidateBasket(initialCandidates: CandidateItem[] = []) {
  const [candidates, setCandidates] = React.useState<CandidateItem[]>(initialCandidates);

  const addCandidate = React.useCallback((candidate: Omit<CandidateItem, "addedAt">) => {
    setCandidates((prev) => {
      if (prev.some((c) => c.id === candidate.id)) {
        return prev; // Already exists
      }
      return [...prev, { ...candidate, addedAt: new Date().toISOString() }];
    });
  }, []);

  const removeCandidate = React.useCallback((id: string) => {
    setCandidates((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const updateNote = React.useCallback((id: string, note: string) => {
    setCandidates((prev) => prev.map((c) => (c.id === id ? { ...c, note } : c)));
  }, []);

  const clearAll = React.useCallback(() => {
    setCandidates([]);
  }, []);

  const isSelected = React.useCallback((id: string) => candidates.some((c) => c.id === id), [candidates]);

  return {
    candidates,
    addCandidate,
    removeCandidate,
    updateNote,
    clearAll,
    isSelected,
    count: candidates.length,
  };
}
