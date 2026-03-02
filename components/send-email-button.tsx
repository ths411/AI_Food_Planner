"use client";

import { useState } from "react";

export default function SendEmailButton({ shareToken }: { shareToken: string }) {
  const [status, setStatus] = useState("");

  async function send() {
    setStatus("Sending...");
    const response = await fetch("/api/plan/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shareToken })
    });
    const payload = await response.json();
    if (!response.ok) {
      setStatus(payload.error ?? "Failed");
      return;
    }
    setStatus("Email sent");
  }

  return (
    <div className="flex items-center gap-3">
      <button onClick={send} className="rounded border border-black/10 px-3 py-2 text-sm">
        Send to email
      </button>
      <span className="text-sm text-[var(--muted)]">{status}</span>
    </div>
  );
}

