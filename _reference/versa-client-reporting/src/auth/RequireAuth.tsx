import { ReactNode, useEffect, useState } from "react";
import { getStoredToken, initiateGoogleLogin } from "./GoogleAuth";

interface RequireAuthProps {
  children: ReactNode;
}

export function RequireAuth({ children }: RequireAuthProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const skipAuth = import.meta.env.VITE_SKIP_AUTH === "true";
    if (skipAuth) {
      setIsAuthenticated(true);
      setIsLoading(false);
      return;
    }

    const token = getStoredToken();
    if (token) {
      setIsAuthenticated(true);
    } else {
      const urlParams = new URLSearchParams(window.location.hash.slice(1));
      const idToken = urlParams.get("id_token");

      if (idToken) {
        sessionStorage.setItem("google_id_token", idToken);
        setIsAuthenticated(true);
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname,
        );
      } else if (!window.location.pathname.includes("/auth/callback")) {
        initiateGoogleLogin();
        return;
      }
    }
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <div>Redirecting to login...</div>;
  }

  return <>{children}</>;
}
