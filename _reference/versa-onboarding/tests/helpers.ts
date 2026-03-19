import { resetMockStore } from "@/lib/mock/store";

/** Standard mocks for all API route tests. Call in beforeEach. */
export function setupApiMocks() {
  resetMockStore();
}

/** Create a minimal Request object for API route testing. */
export function makeJsonRequest(body: unknown, method = "POST"): Request {
  return new Request("http://localhost:3000/api/test", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
