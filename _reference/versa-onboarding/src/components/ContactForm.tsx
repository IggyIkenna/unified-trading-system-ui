"use client";

import { FormEvent, useState } from "react";

export default function ContactForm() {
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("loading");
    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          email: formData.get("email"),
          message: formData.get("message"),
        }),
      });

      if (!response.ok) {
        throw new Error("Request failed");
      }
      form.reset();
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-4"
      suppressHydrationWarning
    >
      <label className="text-sm font-medium">
        Name
        <input
          name="name"
          required
          className="mt-2 w-full rounded border border-neutral-300 px-3 py-2"
          type="text"
        />
      </label>
      <label className="text-sm font-medium">
        Email
        <input
          name="email"
          required
          className="mt-2 w-full rounded border border-neutral-300 px-3 py-2"
          type="email"
        />
      </label>
      <label className="text-sm font-medium">
        Message
        <textarea
          name="message"
          required
          className="mt-2 min-h-[140px] w-full rounded border border-neutral-300 px-3 py-2"
        />
      </label>
      <button
        type="submit"
        disabled={status === "loading"}
        className="rounded bg-black px-4 py-2 text-white disabled:opacity-60"
      >
        {status === "loading" ? "Sending..." : "Send message"}
      </button>
      {status === "success" && (
        <p className="text-sm text-green-600">Thanks! We will be in touch.</p>
      )}
      {status === "error" && (
        <p className="text-sm text-red-600">
          Something went wrong. Please try again.
        </p>
      )}
    </form>
  );
}
