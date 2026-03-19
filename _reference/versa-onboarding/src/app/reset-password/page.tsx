"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import { firebaseAuth } from "@/lib/firebaseClient";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [oobCode, setOobCode] = useState<string | null>(null);
  const [invalidLink, setInvalidLink] = useState(false);
  const [verifying, setVerifying] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const code = params.get("oobCode");
    const mode = params.get("mode");
    if (!code || mode !== "resetPassword") {
      setInvalidLink(true);
      setVerifying(false);
      return;
    }
    verifyPasswordResetCode(firebaseAuth, code)
      .then(() => {
        setOobCode(code);
      })
      .catch(() => {
        setInvalidLink(true);
      })
      .finally(() => {
        setVerifying(false);
      });
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (!oobCode) return;
    setLoading(true);
    try {
      await confirmPasswordReset(firebaseAuth, oobCode, password);
      setSuccess(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      if (
        message.includes("expired") ||
        message.includes("auth/expired-action-code")
      ) {
        setError("This reset link has expired. Please request a new one.");
      } else if (
        message.includes("invalid") ||
        message.includes("auth/invalid-action-code")
      ) {
        setError("This reset link is invalid or has already been used.");
      } else if (
        message.includes("weak-password") ||
        message.includes("auth/weak-password")
      ) {
        setError("Password is too weak. Use at least 6 characters.");
      } else {
        setError(
          "Failed to reset password. Please try again or request a new link.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  if (invalidLink) {
    return (
      <div className="mx-auto flex max-w-md flex-col gap-6 px-6 py-16">
        <h1 className="text-2xl font-semibold">Invalid link</h1>
        <p className="text-neutral-600">
          This password reset link is invalid or has expired. Please request a
          new one.
        </p>
        <Link
          href="/forgot-password"
          className="rounded bg-black px-4 py-2 text-center text-white"
        >
          Request new link
        </Link>
        <Link
          href="/login"
          className="text-center text-sm text-neutral-600 hover:text-black"
        >
          Back to Log in
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="mx-auto flex max-w-md flex-col gap-6 px-6 py-16">
        <h1 className="text-2xl font-semibold">Password reset</h1>
        <p className="text-neutral-600">
          Your password has been updated. You can now log in with your new
          password.
        </p>
        <Link
          href="/login"
          className="rounded bg-black px-4 py-2 text-center text-white"
        >
          Log in
        </Link>
      </div>
    );
  }

  if (verifying) {
    return (
      <div className="mx-auto flex max-w-md flex-col gap-6 px-6 py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-black" />
        <p className="text-neutral-600">Verifying link...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-6 py-16">
      <h1 className="text-2xl font-semibold">Set new password</h1>
      <p className="text-neutral-600">
        Enter your new password below. It must be at least 6 characters.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="text-sm font-medium">
          New password
          <input
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            className="mt-2 w-full rounded border border-neutral-300 px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <label className="text-sm font-medium">
          Confirm password
          <input
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            className="mt-2 w-full rounded border border-neutral-300 px-3 py-2"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          {loading ? "Resetting..." : "Reset password"}
        </button>
      </form>
      <Link
        href="/login"
        className="text-center text-sm text-neutral-600 hover:text-black"
      >
        Back to Log in
      </Link>
    </div>
  );
}
