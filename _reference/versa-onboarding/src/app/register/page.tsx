"use client";

import { FormEvent, useState } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { firebaseAuth, firestore } from "@/lib/firebaseClient";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const credential = await createUserWithEmailAndPassword(
        firebaseAuth,
        email,
        password,
      );
      if (name) {
        await updateProfile(credential.user, { displayName: name });
      }
      await setDoc(doc(firestore, "users", credential.user.uid), {
        email,
        displayName: name || "",
        role: "user",
        groupIds: [],
        presentationIds: [],
        createdAt: new Date().toISOString(),
      });
      const idToken = await credential.user.getIdToken();
      const sessionResponse = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ idToken }),
      });
      if (!sessionResponse.ok) {
        let detail = "unknown";
        try {
          const payload = (await sessionResponse.json()) as {
            error?: string;
            detail?: string;
          };
          detail = payload.detail || payload.error || "unknown";
        } catch {
          detail = "invalid-json";
        }
        void detail;
        throw new Error("Session creation failed");
      }
      window.location.href = "/portal";
    } catch (_err) {
      setError("Unable to register with those details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-6 py-16">
      <h1 className="text-2xl font-semibold">Register</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="text-sm font-medium">
          Name
          <input
            type="text"
            className="mt-2 w-full rounded border border-neutral-300 px-3 py-2"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
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
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          {loading ? "Creating account..." : "Register"}
        </button>
      </form>
    </div>
  );
}
