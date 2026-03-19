"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { firebaseAuth, firestore } from "@/lib/firebaseClient";

const IS_MOCK = process.env.NEXT_PUBLIC_MOCK_MODE === "true";

export default function LoginPage() {
  const [email, setEmail] = useState(IS_MOCK ? "admin@odum-research.com" : "");
  const [password, setPassword] = useState(IS_MOCK ? "mock-password" : "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleMockLogin = async () => {
    setLoading(true);
    const sessionResponse = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ idToken: "mock-id-token" }),
    });
    if (!sessionResponse.ok) {
      setError("Mock login failed");
      setLoading(false);
      return;
    }
    const params = new URLSearchParams(window.location.search);
    window.location.href = params.get("next") || "/portal";
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (IS_MOCK) {
      return handleMockLogin();
    }

    setLoading(true);
    try {
      const credential = await signInWithEmailAndPassword(
        firebaseAuth,
        email,
        password,
      );
      const userRef = doc(firestore, "users", credential.user.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          email: credential.user.email ?? "",
          displayName: credential.user.displayName ?? "",
          role: "user",
          groupIds: [],
          presentationIds: [],
          createdAt: new Date().toISOString(),
        });
      }

      const idToken = await credential.user.getIdToken();
      const sessionResponse = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ idToken }),
      });
      if (!sessionResponse.ok) {
        throw new Error("Session creation failed");
      }
      const params = new URLSearchParams(window.location.search);
      window.location.href = params.get("next") || "/portal";
    } catch {
      setError("Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-6 py-16">
      <h1 className="text-2xl font-semibold">Log in</h1>
      {IS_MOCK && (
        <div className="rounded border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          Mock mode — click Log in to auto-authenticate as admin
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="text-sm font-medium">
          Email
          <input
            type="email"
            required
            className="mt-2 w-full rounded border border-neutral-300 px-3 py-2"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label className="text-sm font-medium">
          Password
          <input
            type="password"
            required
            className="mt-2 w-full rounded border border-neutral-300 px-3 py-2"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        {!IS_MOCK && (
          <div className="flex justify-end">
            <Link
              href="/forgot-password"
              className="text-sm text-neutral-600 hover:text-black"
            >
              Forgot password?
            </Link>
          </div>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Log in"}
        </button>
      </form>
    </div>
  );
}
