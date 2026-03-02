"use client";

import { FormEvent, useState } from "react";

export default function OffersPage() {
  const [storeKey, setStoreKey] = useState("mock");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState("");

  async function onUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      setStatus("Select a file first");
      return;
    }

    setStatus("Uploading...");
    const form = new FormData();
    form.append("storeKey", storeKey);
    form.append("file", file);

    const response = await fetch("/api/offers/upload", {
      method: "POST",
      body: form
    });
    const payload = await response.json();
    if (!response.ok) {
      setStatus(payload.error ?? "Upload failed");
      return;
    }
    setStatus(`Parsed and inserted ${payload.inserted} offers`);
  }

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Offers Manual Upload</h1>
      <p className="text-sm text-[var(--muted)]">Fallback path for flyer PDF/image/text parsing. Expected line format: Product Name - 25 DKK</p>
      <form onSubmit={onUpload} className="grid gap-3 rounded-xl border border-black/10 bg-white p-5 md:grid-cols-3">
        <input className="rounded border px-3 py-2" value={storeKey} onChange={(event) => setStoreKey(event.target.value)} />
        <input className="rounded border px-3 py-2" type="file" onChange={(event) => setFile(event.target.files?.[0] ?? null)} required />
        <button className="rounded bg-[var(--brand)] px-4 py-2 text-white" type="submit">Upload flyer</button>
      </form>
      <p className="text-sm text-[var(--muted)]">{status}</p>
    </section>
  );
}

