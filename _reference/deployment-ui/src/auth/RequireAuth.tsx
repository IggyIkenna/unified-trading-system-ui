import { ReactNode, useEffect, useState } from "react";
import { getStoredToken, initiateGoogleLogin } from "./GoogleAuth";
import {
  getCognitoToken,
  handleCognitoCallback,
  initiateCognitoLogin,
} from "./CognitoAuth";

interface RequireAuthProps {
  children: ReactNode;
}

const SKIP_AUTH =
  import.meta.env.VITE_SKIP_AUTH === "true" ||
  import.meta.env.VITE_MOCK_API === "true";
const AUTH_PROVIDER = import.meta.env.VITE_AUTH_PROVIDER || "google";

export function RequireAuth({ children }: RequireAuthProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (SKIP_AUTH) {
      setIsAuthenticated(true);
      setIsLoading(false);
      return;
    }

    void (async () => {
      if (AUTH_PROVIDER === "cognito") {
        const existing = getCognitoToken();
        if (existing) {
          setIsAuthenticated(true);
          setIsLoading(false);
          return;
        }
        // Handle PKCE callback (code in query string)
        if (new URLSearchParams(window.location.search).has("code")) {
          const ok = await handleCognitoCallback();
          if (ok) {
            window.history.replaceState(
              {},
              document.title,
              window.location.pathname,
            );
            setIsAuthenticated(true);
            setIsLoading(false);
            return;
          }
        }
        if (!window.location.pathname.includes("/auth/callback")) {
          await initiateCognitoLogin();
        }
      } else {
        // Google implicit flow
        const token = getStoredToken();
        if (token) {
          setIsAuthenticated(true);
          setIsLoading(false);
          return;
        }
        const urlParams = new URLSearchParams(window.location.hash.slice(1));
        const idToken = urlParams.get("id_token");
        if (idToken) {
          sessionStorage.setItem("google_id_token", idToken);
          window.history.replaceState(
            {},
            document.title,
            window.location.pathname,
          );
          setIsAuthenticated(true);
        } else if (!window.location.pathname.includes("/auth/callback")) {
          initiateGoogleLogin();
        }
      }
      setIsLoading(false);
    })();
  }, []);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <div>Redirecting to login...</div>;
  }

  return <>{children}</>;
}
