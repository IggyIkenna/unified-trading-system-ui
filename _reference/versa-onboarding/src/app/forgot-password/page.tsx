"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { firebaseAuth } from "@/lib/firebaseClient";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    setSent(false);
    try {
      const actionCodeSettings = {
        url: `${typeof window !== "undefined" ? window.location.origin : ""}/reset-password`,
        handleCodeInApp: true,
      };
      await sendPasswordResetEmail(firebaseAuth, email, actionCodeSettings);
      setSent(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      if (
        message.includes("user-not-found") ||
        message.includes("auth/user-not-found")
      ) {
        setError("No account found with this email address.");
      } else if (
        message.includes("invalid-email") ||
        message.includes("auth/invalid-email")
      ) {
        setError("Please enter a valid email address.");
      } else if (
        message.includes("too-many-requests") ||
        message.includes("auth/too-many-requests")
      ) {
        setError("Too many attempts. Please try again later.");
      } else {
        setError("Failed to send reset email. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="mx-auto flex max-w-md flex-col gap-6 px-6 py-16">
        <h1 className="text-2xl font-semibold">Check your email</h1>
        <p className="text-neutral-600">
          We&apos;ve sent a password reset link to <strong>{email}</strong>.
          Click the link in the email to set a new password.
        </p>
        <p className="text-sm text-neutral-500">
          Didn&apos;t receive the email? Check your spam folder or{" "}
          <button
            type="button"
            onClick={() => setSent(false)}
            className="font-medium text-black underline hover:no-underline"
          >
            try again
          </button>
        </p>
        <Link
          href="/login"
          className="rounded border border-neutral-300 px-4 py-2 text-center text-sm font-medium text-neutral-700 hover:border-black hover:text-black"
        >
          Back to Log in
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-6 py-16">
      <h1 className="text-2xl font-semibold">Forgot password</h1>
      <p className="text-neutral-600">
        Enter your email address and we&apos;ll send you a link to reset your
        password.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="text-sm font-medium">
          Email
          <input
            type="email"
            required
            autoComplete="email"
            className="mt-2 w-full rounded border border-neutral-300 px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          {loading ? "Sending..." : "Send reset link"}
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
