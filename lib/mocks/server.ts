/**
 * MSW server — for Jest/node test environments.
 *
 * Usage in tests:
 *   import { server } from "@/lib/mocks/server"
 *   beforeAll(() => server.listen())
 *   afterEach(() => server.resetHandlers())
 *   afterAll(() => server.close())
 */

import { setupServer } from "msw/node"
import { handlers } from "./handlers"

export const server = setupServer(...handlers)
