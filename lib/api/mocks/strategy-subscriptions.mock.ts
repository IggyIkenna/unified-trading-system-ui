/**
 * Plan D — in-memory mock for strategy-subscription Firestore behaviour.
 *
 * Mirrors the UTA in-memory ``_SubscriptionStore`` semantics: at most one
 * active DART_EXCLUSIVE per instance_id. Used by the UI when
 * ``NEXT_PUBLIC_MOCK_API=true``. Persists to module-scope memory only — no
 * Firestore wire-up.
 *
 * Wire from app boot (or per-test) by calling ``installSubscriptionMock``.
 */

import { ExclusiveLockViolationError, type SubscriptionRecord, type SubscriptionType } from "../strategy-subscriptions";

interface MockSubscription extends SubscriptionRecord {
  released_at?: string;
}

const _store: Map<string, MockSubscription> = new Map();

function _key(instanceId: string, clientId: string, subscribedAt: string): string {
  return `${instanceId}::${clientId}::${subscribedAt}`;
}

export function activeExclusiveHolderForInstance(instanceId: string): string | null {
  for (const sub of _store.values()) {
    if (sub.instance_id === instanceId && sub.exclusive_lock && !sub.released_at) {
      return sub.client_id;
    }
  }
  return null;
}

export function listSubscriptionsForClient(clientId: string): MockSubscription[] {
  return Array.from(_store.values()).filter((s) => s.client_id === clientId && !s.released_at);
}

export function listAllSubscriptions(): MockSubscription[] {
  return Array.from(_store.values());
}

export function mockSubscribe(args: {
  instanceId: string;
  clientId: string;
  subscriptionType: SubscriptionType;
}): SubscriptionRecord {
  const now = new Date().toISOString();
  if (args.subscriptionType === "dart_exclusive") {
    const existing = activeExclusiveHolderForInstance(args.instanceId);
    if (existing && existing !== args.clientId) {
      throw new ExclusiveLockViolationError(`instance_id=${args.instanceId} held by client_id=${existing}`);
    }
  }
  const versionId = `v_genesis_${args.instanceId.slice(0, 16)}`;
  const sub: MockSubscription = {
    instance_id: args.instanceId,
    client_id: args.clientId,
    subscription_type: args.subscriptionType,
    subscribed_at: now,
    version_id: versionId,
    exclusive_lock: args.subscriptionType === "dart_exclusive",
  };
  _store.set(_key(args.instanceId, args.clientId, now), sub);
  return sub;
}

export function mockUnsubscribe(args: { instanceId: string; clientId: string }): { released_at: string } | null {
  const now = new Date().toISOString();
  for (const [key, sub] of _store.entries()) {
    if (
      sub.instance_id === args.instanceId &&
      sub.client_id === args.clientId &&
      sub.subscription_type === "dart_exclusive" &&
      !sub.released_at
    ) {
      _store.set(key, { ...sub, released_at: now, exclusive_lock: false });
      return { released_at: now };
    }
  }
  return null;
}

export function resetMockSubscriptionStore(): void {
  _store.clear();
}

export function seedMockSubscription(sub: MockSubscription): void {
  _store.set(_key(sub.instance_id, sub.client_id, sub.subscribed_at), sub);
}
