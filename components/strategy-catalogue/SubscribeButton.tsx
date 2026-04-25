"use client";

/**
 * Plan D — SubscribeButton.
 *
 * Toggle subscribe ↔ unsubscribe with optimistic UI + 409 rollback.
 *
 * Disable rules:
 *  - productRouting excludes "DART" → disabled
 *  - existingExclusiveHolder set AND ≠ callerClientId → disabled, tooltip
 *    "Held by {holder}"
 *
 * Surface tests at:
 *   __tests__/components/strategy-catalogue/subscribe-button.test.tsx
 */

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  ExclusiveLockViolationError,
  subscribeToInstance,
  unsubscribeFromInstance,
  type SubscriptionType,
} from "@/lib/api/strategy-subscriptions";

export interface SubscribeButtonProps {
  readonly instanceId: string;
  readonly productRouting: readonly string[];
  readonly callerClientId: string;
  readonly callerEntitlements: readonly string[];
  readonly existingExclusiveHolder?: string | null;
  /** Initial state when caller already holds the exclusive on mount. */
  readonly initiallySubscribed?: boolean;
  /** Subscription type to create when clicked. Defaults to dart_exclusive. */
  readonly subscriptionType?: SubscriptionType;
  readonly onChange?: (subscribed: boolean) => void;
}

export function SubscribeButton(props: SubscribeButtonProps): React.JSX.Element {
  const {
    instanceId,
    productRouting,
    callerClientId,
    existingExclusiveHolder,
    initiallySubscribed,
    subscriptionType = "dart_exclusive",
    onChange,
  } = props;

  const [subscribed, setSubscribed] = React.useState<boolean>(!!initiallySubscribed);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const dartRouted = productRouting.includes("DART");
  const heldByOther = !!existingExclusiveHolder && existingExclusiveHolder !== callerClientId && !subscribed;
  const disabled = busy || !dartRouted || heldByOther;

  const tooltip = !dartRouted
    ? "Strategy not routed to DART"
    : heldByOther
      ? `Held by ${existingExclusiveHolder ?? "another client"}`
      : "";

  const onClick = async () => {
    setBusy(true);
    setError(null);
    if (subscribed) {
      // optimistic flip
      setSubscribed(false);
      try {
        await unsubscribeFromInstance({ instanceId, clientId: callerClientId });
        onChange?.(false);
      } catch (err) {
        setSubscribed(true); // rollback
        setError((err as Error).message);
      } finally {
        setBusy(false);
      }
      return;
    }
    setSubscribed(true);
    try {
      await subscribeToInstance({ instanceId, clientId: callerClientId, subscriptionType });
      onChange?.(true);
    } catch (err) {
      setSubscribed(false); // rollback
      if (err instanceof ExclusiveLockViolationError) {
        setError(err.message);
      } else {
        setError((err as Error).message);
      }
    } finally {
      setBusy(false);
    }
  };

  const label = subscribed ? "Unsubscribe" : "Subscribe (DART Exclusive)";

  return (
    <div className="inline-flex flex-col gap-1">
      <Button type="button" onClick={onClick} disabled={disabled} title={tooltip} data-testid="subscribe-button">
        {label}
      </Button>
      {error && (
        <span role="alert" className="text-xs text-destructive">
          {error}
        </span>
      )}
    </div>
  );
}
