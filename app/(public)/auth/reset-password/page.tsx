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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getFirebaseAuth } from "@/lib/auth/firebase-config";

type PageState = "verifying" | "form" | "success" | "error";

function resolveErrorMessage(code: string): string {
  if (code === "auth/expired-action-code") {
    return "This reset link has expired. Please request a new one.";
  }
  if (code === "auth/invalid-action-code") {
    return "This reset link has already been used or is invalid.";
  }
  return "Unable to reset your password.";
}

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const [state, setState] = React.useState<PageState>("verifying");
  const [errorMessage, setErrorMessage] = React.useState<string>("");
  const [verifiedEmail, setVerifiedEmail] = React.useState<string>("");
  const [newPassword, setNewPassword] = React.useState<string>("");
  const [confirmPassword, setConfirmPassword] = React.useState<string>("");
  const [validationError, setValidationError] = React.useState<string>("");
  const [submitting, setSubmitting] = React.useState<boolean>(false);

  const oobCode = searchParams.get("oobCode");
  const mode = searchParams.get("mode");

  React.useEffect(() => {
    if (mode !== "resetPassword" || !oobCode) {
      setErrorMessage("Unable to reset your password.");
      setState("error");
      return;
    }

    const auth = getFirebaseAuth();
    if (!auth) {
      setErrorMessage("Unable to reset your password.");
      setState("error");
      return;
    }

    let cancelled = false;

    import("firebase/auth")
      .then(({ verifyPasswordResetCode }) =>
        verifyPasswordResetCode(auth, oobCode)
      )
      .then((email) => {
        if (cancelled) return;
        setVerifiedEmail(email);
        setState("form");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const code =
          err instanceof Error && "code" in err
            ? (err as { code: string }).code
            : "";
        setErrorMessage(resolveErrorMessage(code));
        setState("error");
      });

    return () => {
      cancelled = true;
    };
  }, [mode, oobCode]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setValidationError("");

    if (newPassword.length < 8) {
      setValidationError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setValidationError("Passwords do not match.");
      return;
    }

    const auth = getFirebaseAuth();
    if (!auth || !oobCode) {
      setErrorMessage("Unable to reset your password.");
      setState("error");
      return;
    }

    setSubmitting(true);
    try {
      const { confirmPasswordReset } = await import("firebase/auth");
      await confirmPasswordReset(auth, oobCode, newPassword);
      setState("success");
    } catch (err: unknown) {
      const code =
        err instanceof Error && "code" in err
          ? (err as { code: string }).code
          : "";
      setErrorMessage(resolveErrorMessage(code));
      setState("error");
    } finally {
      setSubmitting(false);
    }
  }

  if (state === "verifying") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="container px-4 flex items-center justify-center">
          <div className="w-full max-w-md">
            {state === "form" && (
              <Card>
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">Reset your password</CardTitle>
                  {verifiedEmail && (
                    <CardDescription>
                      Resetting password for:{" "}
                      <span className="font-medium text-foreground">
                        {verifiedEmail}
                      </span>
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-password">New password</Label>
                      <Input
                        id="new-password"
                        type="password"
                        autoComplete="new-password"
                        minLength={8}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm password</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        autoComplete="new-password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>
                    {validationError && (
                      <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
                        {validationError}
                      </p>
                    )}
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={submitting}
                    >
                      {submitting ? "Updating..." : "Set new password"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {state === "success" && (
              <Card>
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">Password updated</CardTitle>
                  <CardDescription>
                    You can now sign in with your new password.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild className="w-full">
                    <Link href="/login">Sign in</Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            {state === "error" && (
              <Card>
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">Reset failed</CardTitle>
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
