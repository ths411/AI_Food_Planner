"use client";

import { FormEvent, useEffect, useState } from "react";

type Preferences = {
  cuisines: string[];
  disliked: string[];
  allergies: string[];
  diet: "omnivore" | "flexitarian" | "vegetarian";
  budgetSensitivity: "low" | "medium" | "high";
  selectedStores: string[];
};

const defaultPreferences: Preferences = {
  cuisines: ["nordic"],
  disliked: [],
  allergies: [],
  diet: "flexitarian",
  budgetSensitivity: "medium",
  selectedStores: ["mock", "foetex"]
};

export default function SettingsPage() {
  const [email, setEmail] = useState("demo@example.com");
  const [peopleCount, setPeopleCount] = useState(2);
  const [adultsCount, setAdultsCount] = useState(2);
  const [childrenCount, setChildrenCount] = useState(0);
  const [preferences, setPreferences] = useState<Preferences>(defaultPreferences);
  const [status, setStatus] = useState<string>("");

  useEffect(() => {
    const stored = localStorage.getItem("planner-email");
    if (stored) {
      setEmail(stored);
    }
  }, []);

  async function loadSettings(targetEmail: string) {
    const response = await fetch(`/api/settings?email=${encodeURIComponent(targetEmail)}`);
    const payload = await response.json();
    if (!response.ok) {
      setStatus(payload.error ?? "Failed to load settings");
      return;
    }
    setPeopleCount(payload.user.peopleCount ?? 2);
    setAdultsCount(payload.user.adultsCount ?? 2);
    setChildrenCount(payload.user.childrenCount ?? 0);
    setPreferences({ ...defaultPreferences, ...payload.user.preferences });
  }

  useEffect(() => {
    loadSettings(email).catch(() => setStatus("Failed to load settings"));
  }, [email]);

  async function onSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("Saving...");
    const response = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, peopleCount, adultsCount, childrenCount, preferences })
    });
    const payload = await response.json();
    if (!response.ok) {
      setStatus(payload.error ?? "Save failed");
      return;
    }
    localStorage.setItem("planner-email", email);
    setStatus("Saved");
  }

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <form onSubmit={onSave} className="rounded-xl border border-black/10 bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-1">
            <span>Email</span>
            <input className="rounded border px-3 py-2" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
          <label className="grid gap-1">
            <span>People count</span>
            <input className="rounded border px-3 py-2" type="number" min={1} value={peopleCount} onChange={(event) => setPeopleCount(Number(event.target.value))} required />
          </label>
          <label className="grid gap-1">
            <span>Adults</span>
            <input className="rounded border px-3 py-2" type="number" min={0} value={adultsCount} onChange={(event) => setAdultsCount(Number(event.target.value))} />
          </label>
          <label className="grid gap-1">
            <span>Children</span>
            <input className="rounded border px-3 py-2" type="number" min={0} value={childrenCount} onChange={(event) => setChildrenCount(Number(event.target.value))} />
          </label>
          <label className="grid gap-1">
            <span>Cuisine tags (comma separated)</span>
            <input className="rounded border px-3 py-2" value={preferences.cuisines.join(", ")} onChange={(event) => setPreferences({ ...preferences, cuisines: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) })} />
          </label>
          <label className="grid gap-1">
            <span>Disliked ingredients</span>
            <input className="rounded border px-3 py-2" value={preferences.disliked.join(", ")} onChange={(event) => setPreferences({ ...preferences, disliked: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) })} />
          </label>
          <label className="grid gap-1">
            <span>Allergies</span>
            <input className="rounded border px-3 py-2" value={preferences.allergies.join(", ")} onChange={(event) => setPreferences({ ...preferences, allergies: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) })} />
          </label>
          <label className="grid gap-1">
            <span>Diet</span>
            <select className="rounded border px-3 py-2" value={preferences.diet} onChange={(event) => setPreferences({ ...preferences, diet: event.target.value as Preferences["diet"] })}>
              <option value="omnivore">Omnivore</option>
              <option value="flexitarian">Flexitarian</option>
              <option value="vegetarian">Vegetarian</option>
            </select>
          </label>
          <label className="grid gap-1">
            <span>Budget sensitivity</span>
            <select className="rounded border px-3 py-2" value={preferences.budgetSensitivity} onChange={(event) => setPreferences({ ...preferences, budgetSensitivity: event.target.value as Preferences["budgetSensitivity"] })}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>
          <label className="grid gap-1">
            <span>Selected stores (comma separated keys)</span>
            <input className="rounded border px-3 py-2" value={preferences.selectedStores.join(", ")} onChange={(event) => setPreferences({ ...preferences, selectedStores: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) })} />
          </label>
        </div>
        <div className="mt-5 flex items-center gap-3">
          <button className="rounded bg-[var(--brand)] px-4 py-2 text-white" type="submit">
            Save Settings
          </button>
          <span className="text-sm text-[var(--muted)]">{status}</span>
        </div>
      </form>
    </section>
  );
}

