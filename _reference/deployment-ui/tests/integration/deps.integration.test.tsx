/**
 * Functional integration tests — verifies deployment-ui works correctly
 * with real @unified-trading/ui-auth and @unified-trading/ui-kit deps.
 *
 * Unlike unit tests (which mock these deps), these tests import the REAL
 * library components to catch contract drift between the UI and its deps.
 *
 * NOTE: RequireAuth uses react-router's useNavigate internally. With file:
 * linked deps, RequireAuth resolves to a different React copy — causing
 * "invalid hook call". We therefore test AuthProvider + useAuth (the context
 * contract) directly, and verify RequireAuth's export exists.
 *
 * Env: VITE_MOCK_API=true (.env.test) => skipAuth=true => AuthProvider dev bypass.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

// Real imports from @unified-trading/ui-auth — NOT mocked
import {
  AuthProvider,
  RequireAuth,
  useAuth,
  useAuthToken,
  authFetch,
  authFetchJson,
  emitAuthEvent,
} from "@unified-trading/ui-auth";
import type {
  AuthProviderConfig,
  AuthUser,
  AuthState,
} from "@unified-trading/ui-auth";

// Real imports from @unified-trading/ui-kit — NOT mocked
import {
  ErrorBoundary,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  cn,
  Input,
  Label,
  mockJson,
  mockDelay,
} from "@unified-trading/ui-kit";

// Mock lucide-react to avoid SVG rendering issues in jsdom
vi.mock(
  "lucide-react",
  () =>
    new Proxy(
      {},
      {
        get: (_target, prop) => {
          if (prop === "__esModule") return true;
          return () => null;
        },
      },
    ),
);

const skipAuthConfig: AuthProviderConfig = {
  provider: "google",
  clientId: "",
  redirectUri: "http://localhost/auth/callback",
  scopes: ["openid", "email", "profile"],
  skipAuth: true,
  serviceName: "deployment-ui-test",
};

describe("@unified-trading/ui-auth integration", () => {
  it("AuthProvider with skipAuth=true renders children immediately", () => {
    render(
      <AuthProvider config={skipAuthConfig}>
        <div data-testid="protected">Protected content</div>
      </AuthProvider>,
    );
    expect(screen.getByTestId("protected")).toBeInTheDocument();
  });

  it("useAuth returns dev credentials when skipAuth=true", () => {
    function AuthStatus() {
      const auth = useAuth();
      return (
        <div>
          <span data-testid="is-auth">{String(auth.isAuthenticated)}</span>
          <span data-testid="is-loading">{String(auth.isLoading)}</span>
          <span data-testid="token">{auth.token}</span>
          <span data-testid="email">{auth.user?.email}</span>
        </div>
      );
    }

    render(
      <AuthProvider config={skipAuthConfig}>
        <AuthStatus />
      </AuthProvider>,
    );

    expect(screen.getByTestId("is-auth")).toHaveTextContent("true");
    expect(screen.getByTestId("is-loading")).toHaveTextContent("false");
    expect(screen.getByTestId("token")).toHaveTextContent("dev_token");
    expect(screen.getByTestId("email")).toHaveTextContent("dev@local");
  });

  it("useAuth provides login and logout functions", () => {
    function AuthActions() {
      const auth = useAuth();
      return (
        <div>
          <span data-testid="has-login">
            {String(typeof auth.login === "function")}
          </span>
          <span data-testid="has-logout">
            {String(typeof auth.logout === "function")}
          </span>
        </div>
      );
    }

    render(
      <AuthProvider config={skipAuthConfig}>
        <AuthActions />
      </AuthProvider>,
    );

    expect(screen.getByTestId("has-login")).toHaveTextContent("true");
    expect(screen.getByTestId("has-logout")).toHaveTextContent("true");
  });

  it("exports RequireAuth as a function component", () => {
    expect(typeof RequireAuth).toBe("function");
  });

  it("exports useAuthToken hook", () => {
    expect(typeof useAuthToken).toBe("function");
  });

  it("exports authFetch and authFetchJson utilities", () => {
    expect(typeof authFetch).toBe("function");
    expect(typeof authFetchJson).toBe("function");
  });

  it("exports emitAuthEvent for telemetry", () => {
    expect(typeof emitAuthEvent).toBe("function");
  });

  it("type AuthProviderConfig includes all required fields", () => {
    const config: AuthProviderConfig = {
      provider: "google",
      clientId: "test",
      redirectUri: "http://localhost",
      scopes: ["openid"],
      skipAuth: true,
      serviceName: "test",
    };
    expect(config.provider).toBe("google");
    expect(config.skipAuth).toBe(true);
  });

  it("type AuthUser has expected shape", () => {
    const user: AuthUser = { sub: "123", email: "test@test.com", name: "Test" };
    expect(user.sub).toBe("123");
    expect(user.email).toBe("test@test.com");
  });

  it("type AuthState has expected shape", () => {
    const state: AuthState = {
      isAuthenticated: true,
      isLoading: false,
      token: "tok",
      user: { sub: "1", email: "a@b.com" },
    };
    expect(state.isAuthenticated).toBe(true);
  });
});

describe("@unified-trading/ui-kit integration", () => {
  it("ErrorBoundary renders children when no error", () => {
    render(
      <ErrorBoundary>
        <div data-testid="child">OK</div>
      </ErrorBoundary>,
    );
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("ErrorBoundary catches thrown errors and shows fallback UI", () => {
    function Bomb(): React.ReactElement {
      throw new Error("Test explosion");
    }
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>,
    );
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText("Test explosion")).toBeInTheDocument();
    spy.mockRestore();
  });

  it("ErrorBoundary accepts custom fallback", () => {
    function Bomb(): React.ReactElement {
      throw new Error("boom");
    }
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <ErrorBoundary
        fallback={<div data-testid="custom-fallback">Custom error</div>}
      >
        <Bomb />
      </ErrorBoundary>,
    );
    expect(screen.getByTestId("custom-fallback")).toBeInTheDocument();
    spy.mockRestore();
  });

  it("Badge renders text content correctly", () => {
    render(<Badge>Deployed</Badge>);
    expect(screen.getByText("Deployed")).toBeInTheDocument();
  });

  it("Button renders and is clickable", () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Deploy</Button>);
    const button = screen.getByText("Deploy");
    expect(button).toBeInTheDocument();
    button.click();
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("Card composition renders header and content", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Service Config</CardTitle>
        </CardHeader>
        <CardContent>execution-service v1.2.3</CardContent>
      </Card>,
    );
    expect(screen.getByText("Service Config")).toBeInTheDocument();
    expect(screen.getByText("execution-service v1.2.3")).toBeInTheDocument();
  });

  it("Tabs renders with triggers and content panels", () => {
    render(
      <Tabs defaultValue="deploy">
        <TabsList>
          <TabsTrigger value="deploy">Deploy</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="config">Config</TabsTrigger>
        </TabsList>
        <TabsContent value="deploy">
          <div>Deploy form</div>
        </TabsContent>
        <TabsContent value="history">
          <div>Deployment history</div>
        </TabsContent>
        <TabsContent value="config">
          <div>Service config</div>
        </TabsContent>
      </Tabs>,
    );
    expect(screen.getByText("Deploy")).toBeInTheDocument();
    expect(screen.getByText("History")).toBeInTheDocument();
    expect(screen.getByText("Config")).toBeInTheDocument();
    expect(screen.getByText("Deploy form")).toBeInTheDocument();
  });

  it("cn utility merges class names correctly", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
    expect(cn("base", false && "hidden", "extra")).toBe("base extra");
  });

  it("Input renders with placeholder", () => {
    render(<Input placeholder="Enter service name" />);
    expect(
      screen.getByPlaceholderText("Enter service name"),
    ).toBeInTheDocument();
  });

  it("Label renders text content", () => {
    render(<Label>Service</Label>);
    expect(screen.getByText("Service")).toBeInTheDocument();
  });

  it("mockJson creates a valid Response with correct status", () => {
    const resp200 = mockJson({ status: "healthy" });
    expect(resp200).toBeInstanceOf(Response);
    expect(resp200.status).toBe(200);

    const resp404 = mockJson({ error: "not found" }, 404);
    expect(resp404.status).toBe(404);
  });

  it("mockJson response has correct content-type header", async () => {
    const resp = mockJson({ ok: true });
    expect(resp.headers.get("Content-Type")).toBe("application/json");
    const body = await resp.json();
    expect(body).toEqual({ ok: true });
  });

  it("mockDelay returns a promise that resolves", async () => {
    await expect(mockDelay(1)).resolves.toBeUndefined();
  });
});

describe("auth + ui-kit composition (full stack)", () => {
  it("AuthProvider > Tabs + Card tree renders end-to-end", () => {
    render(
      <AuthProvider config={skipAuthConfig}>
        <ErrorBoundary>
          <Tabs defaultValue="deploy">
            <TabsList>
              <TabsTrigger value="deploy">Deploy</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>
            <TabsContent value="deploy">
              <Card>
                <CardContent>
                  <Badge>Ready</Badge>
                  <Button>Deploy Now</Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </ErrorBoundary>
      </AuthProvider>,
    );
    expect(screen.getByText("Deploy")).toBeInTheDocument();
    expect(screen.getByText("Ready")).toBeInTheDocument();
    expect(screen.getByText("Deploy Now")).toBeInTheDocument();
  });

  it("useAuth inside ui-kit Card renders auth state", () => {
    function AuthCard() {
      const auth = useAuth();
      return (
        <Card>
          <CardContent>
            <Badge>
              {auth.isAuthenticated ? "Authenticated" : "Anonymous"}
            </Badge>
          </CardContent>
        </Card>
      );
    }

    render(
      <AuthProvider config={skipAuthConfig}>
        <AuthCard />
      </AuthProvider>,
    );
    expect(screen.getByText("Authenticated")).toBeInTheDocument();
  });
});
