"use client";

import { FormEvent, useEffect, useState } from "react";

type PantryItem = {
  id: string;
  name: string;
  quantityText?: string;
  expiryDate?: string;
};

export default function PantryPage() {
  const [email, setEmail] = useState("demo@example.com");
  const [name, setName] = useState("");
  const [quantityText, setQuantityText] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [items, setItems] = useState<PantryItem[]>([]);
  const [status, setStatus] = useState("");

  async function load() {
    const response = await fetch(`/api/pantry?email=${encodeURIComponent(email)}`);
    const payload = await response.json();
    if (!response.ok) {
      setStatus(payload.error ?? "Failed to load pantry");
      return;
    }
    setItems(payload.pantry);
  }

  useEffect(() => {
    const stored = localStorage.getItem("planner-email");
    if (stored) {
      setEmail(stored);
    }
  }, []);

  useEffect(() => {
    load().catch(() => setStatus("Failed to load pantry"));
  }, [email]);

  async function addItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("Adding...");
    const response = await fetch("/api/pantry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name, quantityText, expiryDate: expiryDate || undefined })
    });
    const payload = await response.json();
    if (!response.ok) {
      setStatus(payload.error ?? "Add failed");
      return;
    }
    setName("");
    setQuantityText("");
    setExpiryDate("");
    setStatus("Added");
    await load();
  }

  async function removeItem(id: string) {
    await fetch(`/api/pantry?id=${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Pantry</h1>
      <form onSubmit={addItem} className="grid gap-3 rounded-xl border border-black/10 bg-white p-5 md:grid-cols-4">
        <input className="rounded border px-3 py-2" placeholder="Item name" value={name} onChange={(event) => setName(event.target.value)} required />
        <input className="rounded border px-3 py-2" placeholder="Quantity (optional)" value={quantityText} onChange={(event) => setQuantityText(event.target.value)} />
        <input className="rounded border px-3 py-2" type="date" value={expiryDate} onChange={(event) => setExpiryDate(event.target.value)} />
        <button type="submit" className="rounded bg-[var(--brand)] px-4 py-2 text-white">Add pantry item</button>
      </form>
      <p className="text-sm text-[var(--muted)]">{status}</p>
      <div className="rounded-xl border border-black/10 bg-white p-5">
        <h2 className="mb-3 text-lg font-medium">Current items</h2>
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between rounded border border-black/10 px-3 py-2">
              <span>
                {item.name} {item.quantityText ? `(${item.quantityText})` : ""} {item.expiryDate ? `- expires ${new Date(item.expiryDate).toISOString().slice(0, 10)}` : ""}
              </span>
              <button className="text-sm text-[var(--warn)]" onClick={() => removeItem(item.id)}>
                Remove
              </button>
            </li>
          ))}
          {items.length === 0 ? <li className="text-sm text-[var(--muted)]">No pantry items yet.</li> : null}
        </ul>
      </div>
    </section>
  );
}

