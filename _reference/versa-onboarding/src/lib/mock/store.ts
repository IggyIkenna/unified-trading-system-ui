/**
 * In-memory mock Firestore for local development.
 * Implements the subset of Firestore API used by the website's API routes.
 */
import {
  MOCK_USERS,
  MOCK_PRESENTATIONS,
  MOCK_GROUPS,
  MOCK_CLIENTS,
} from "./data";

type DocData = Record<string, unknown>;

const collections: Record<string, Record<string, DocData>> = {
  users: { ...MOCK_USERS },
  presentations: { ...MOCK_PRESENTATIONS },
  groups: { ...MOCK_GROUPS },
  clients: { ...MOCK_CLIENTS },
};

class MockDocSnapshot {
  constructor(
    private _id: string,
    private _data: DocData | undefined,
  ) {}
  get id() {
    return this._id;
  }
  get exists() {
    return this._data !== undefined;
  }
  data() {
    return this._data ? { ...this._data } : undefined;
  }
}

class MockQuerySnapshot {
  docs: MockDocSnapshot[];
  constructor(docs: MockDocSnapshot[]) {
    this.docs = docs;
  }
  forEach(callback: (doc: MockDocSnapshot) => void) {
    this.docs.forEach(callback);
  }
}

class MockQuery {
  private _collection: string;
  private _filters: Array<{
    field: string;
    op: string;
    value: unknown;
  }> = [];

  constructor(collection: string) {
    this._collection = collection;
  }

  where(field: string, op: string, value: unknown) {
    const q = new MockQuery(this._collection);
    q._filters = [...this._filters, { field, op, value }];
    return q;
  }

  async get(): Promise<MockQuerySnapshot> {
    const coll = collections[this._collection] ?? {};
    let entries = Object.entries(coll);

    for (const filter of this._filters) {
      if (filter.field === "__name__" && filter.op === "in") {
        const ids = filter.value as string[];
        entries = entries.filter(([id]) => ids.includes(id));
      } else if (filter.op === "in") {
        const vals = filter.value as unknown[];
        entries = entries.filter(([, data]) =>
          vals.includes(data[filter.field]),
        );
      } else if (filter.op === "==") {
        entries = entries.filter(
          ([, data]) => data[filter.field] === filter.value,
        );
      } else if (filter.op === "array-contains") {
        entries = entries.filter(([, data]) => {
          const arr = data[filter.field];
          return Array.isArray(arr) && arr.includes(filter.value);
        });
      } else if (filter.op === "array-contains-any") {
        const vals = filter.value as unknown[];
        entries = entries.filter(([, data]) => {
          const arr = data[filter.field];
          return Array.isArray(arr) && vals.some((v) => arr.includes(v));
        });
      }
    }

    return new MockQuerySnapshot(
      entries.map(([id, data]) => new MockDocSnapshot(id, data)),
    );
  }
}

class MockDocRef {
  _collection: string;
  _id: string;

  constructor(collection: string, id: string) {
    this._collection = collection;
    this._id = id;
  }

  async get() {
    const coll = collections[this._collection] ?? {};
    return new MockDocSnapshot(this._id, coll[this._id]);
  }

  async set(data: DocData) {
    if (!collections[this._collection]) {
      collections[this._collection] = {};
    }
    collections[this._collection][this._id] = { ...data };
  }

  async update(data: Partial<DocData>) {
    const coll = collections[this._collection];
    if (coll?.[this._id]) {
      coll[this._id] = { ...coll[this._id], ...data };
    }
  }

  async delete() {
    const coll = collections[this._collection];
    if (coll) {
      delete coll[this._id];
    }
  }
}

class MockCollectionRef {
  private _name: string;

  constructor(name: string) {
    this._name = name;
  }

  doc(id: string) {
    return new MockDocRef(this._name, id);
  }

  where(field: string, op: string, value: unknown) {
    return new MockQuery(this._name).where(field, op, value);
  }

  async get() {
    const coll = collections[this._name] ?? {};
    return new MockQuerySnapshot(
      Object.entries(coll).map(([id, data]) => new MockDocSnapshot(id, data)),
    );
  }

  async add(data: DocData) {
    const id = `auto-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    if (!collections[this._name]) {
      collections[this._name] = {};
    }
    collections[this._name][id] = { ...data };
    return new MockDocRef(this._name, id);
  }
}

/** Mock Firebase Auth — always verifies sessions successfully in mock mode. */
export const mockAuth = {
  async verifySessionCookie(_cookie: string, _checkRevoked?: boolean) {
    return {
      uid: "mock-admin-uid",
      email: "admin@odum-research.com",
    };
  },
  async createSessionCookie(_idToken: string, _options: { expiresIn: number }) {
    return "mock-session-cookie-value";
  },
};

/** Mock batch writer — collects operations and applies them on commit. */
class MockBatch {
  private ops: Array<() => void> = [];

  set(ref: MockDocRef, data: DocData, _options?: { merge?: boolean }) {
    this.ops.push(() => {
      if (!collections[ref._collection]) collections[ref._collection] = {};
      collections[ref._collection][ref._id] = {
        ...collections[ref._collection][ref._id],
        ...data,
      };
    });
  }

  async commit() {
    this.ops.forEach((op) => op());
  }
}

/** Mock Firestore database — drop-in replacement for `getAdminDb()` return value. */
export const mockDb = {
  collection(name: string) {
    return new MockCollectionRef(name);
  },
  batch() {
    return new MockBatch();
  },
};

/** Reset mock store to initial seed data (for tests). */
export function resetMockStore() {
  collections.users = { ...MOCK_USERS };
  collections.presentations = { ...MOCK_PRESENTATIONS };
  collections.groups = { ...MOCK_GROUPS };
  collections.clients = { ...MOCK_CLIENTS };
}
