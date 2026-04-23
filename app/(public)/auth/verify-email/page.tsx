"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getFirebaseAuth } from "@/lib/auth/firebase-config";

type PageState = "loading" | "success" | "error";

function resolveErrorMessage(code: string): string {
  if (code === "auth/invalid-action-code") {
    return "This verification link has already been used or has expired.";
  }
  if (code === "auth/expired-action-code") {
    return "This verification link has expired. Request a new one.";
  }
  return "Unable to verify your email. The link may be invalid.";
}

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const [state, setState] = React.useState<PageState>("loading");
  const [errorMessage, setErrorMessage] = React.useState<string>("");

  React.useEffect(() => {
    const mode = searchParams.get("mode");
    const oobCode = searchParams.get("oobCode");

    if (mode !== "verifyEmail" || !oobCode) {
      setErrorMessage("Unable to verify your email. The link may be invalid.");
      setState("error");
      return;
    }

    const auth = getFirebaseAuth();
    if (!auth) {
      setErrorMessage("Unable to verify your email. The link may be invalid.");
      setState("error");
      return;
    }

    let cancelled = false;

    import("firebase/auth")
      .then(({ applyActionCode }) => applyActionCode(auth, oobCode))
      .then(() => {
        if (!cancelled) setState("success");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const code = err instanceof Error && "code" in err
          ? (err as { code: string }).code
          : "";
        setErrorMessage(resolveErrorMessage(code));
        setState("error");
      });

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  if (state === "loading") {
    return (
      <div
        className="min-h-screen bg-background flex items-center justify-center"
        aria-busy="true"
      >
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="container px-4 flex items-center justify-center">
          <div className="w-full max-w-md">
            {state === "success" ? (
              <Card>
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">Email verified</CardTitle>
                  <CardDescription>
                    Your email has been verified. You can now sign in to your
                    account.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild className="w-full">
                    <Link href="/login">Go to sign in</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">Verification failed</CardTitle>
                  <CardDescription>{errorMessage}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/login">Back to sign in</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
