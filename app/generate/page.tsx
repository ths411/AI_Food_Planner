"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { addDays, format } from "date-fns";
import { useRouter } from "next/navigation";

type OfferStatus = {
  key: string;
  name: string;
  enabled: boolean;
  status: {
    lastRefreshAt?: string;
    lastSuccessAt?: string;
    lastError?: string | null;
    itemCount?: number;
  } | null;
};

type OfferRow = {
  id: string;
  store: string;
  productName: string;
  priceDkk: number;
  validTo: string;
  category?: string;
};

export default function GeneratePage() {
  const router = useRouter();
  const [email, setEmail] = useState("demo@example.com");
  const [peopleCount, setPeopleCount] = useState(2);
  const [weekStart, setWeekStart] = useState(format(new Date(), "yyyy-MM-dd"));
  const [mealMode, setMealMode] = useState<"dinner" | "lunch_dinner">("dinner");
  const [timeCapMinutes, setTimeCapMinutes] = useState<number | "">("");
  const [statusRows, setStatusRows] = useState<OfferStatus[]>([]);
  const [offers, setOffers] = useState<OfferRow[]>([]);
  const [status, setStatus] = useState("");
  const [stores, setStores] = useState("mock,foetex");

  const selectedStores = useMemo(() => stores.split(",").map((item) => item.trim()).filter(Boolean), [stores]);

  useEffect(() => {
    const stored = localStorage.getItem("planner-email");
    if (stored) {
      setEmail(stored);
    }
  }, []);

  async function loadSettings() {
    const response = await fetch(`/api/settings?email=${encodeURIComponent(email)}`);
    const payload = await response.json();
    if (!response.ok) {
      return;
    }
    setPeopleCount(payload.user.peopleCount ?? 2);
    const storeKeys = payload.user.preferences?.selectedStores ?? ["mock", "foetex"];
    setStores(storeKeys.join(","));
  }

  async function loadOffers() {
    const query = selectedStores.map((key) => `store=${encodeURIComponent(key)}`).join("&");
    const response = await fetch(`/api/offers?${query}`);
    const payload = await response.json();
    if (!response.ok) {
      setStatus(payload.error ?? "Failed to load offers");
      return;
    }
    setStatusRows(payload.status);
    setOffers(payload.offers);
  }

  useEffect(() => {
    loadSettings().catch(() => undefined);
  }, [email]);

  useEffect(() => {
    loadOffers().catch(() => setStatus("Failed to load offers"));
  }, [stores]);

  async function refreshOffers() {
    setStatus("Refreshing offers...");
    const response = await fetch("/api/offers/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stores: selectedStores })
    });
    const payload = await response.json();
    if (!response.ok) {
      setStatus(payload.error ?? "Offer refresh failed");
      return;
    }
    await loadOffers();
    setStatus("Offer refresh complete");
  }

  async function generatePlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("Generating 3 candidates and reranking...");

    const settingsResponse = await fetch(`/api/settings?email=${encodeURIComponent(email)}`);
    const settingsPayload = await settingsResponse.json();
    if (!settingsResponse.ok) {
      setStatus(settingsPayload.error ?? "Could not load settings");
      return;
    }

    const response = await fetch("/api/plan/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        weekStart,
        peopleCount,
        mealMode,
        timeCapMinutes: timeCapMinutes === "" ? undefined : Number(timeCapMinutes),
        preferences: {
          ...settingsPayload.user.preferences,
          selectedStores
        }
      })
    });

    const payload = await response.json();
    if (!response.ok) {
      setStatus(payload.error ?? "Generation failed");
      return;
    }

    setStatus(payload.emailed ? "Generated and emailed" : `Generated (email failed: ${payload.emailError ?? "unknown"})`);
    router.push(`/results/${payload.shareToken}`);
  }

  return (
    <section className="space-y-5">
      <h1 className="text-2xl font-semibold">Generate Plan</h1>
      <form onSubmit={generatePlan} className="grid gap-4 rounded-xl border border-black/10 bg-white p-5 md:grid-cols-2">
        <label className="grid gap-1">
          <span>Email</span>
          <input className="rounded border px-3 py-2" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </label>
        <label className="grid gap-1">
          <span>People</span>
          <input className="rounded border px-3 py-2" type="number" min={1} value={peopleCount} onChange={(event) => setPeopleCount(Number(event.target.value))} required />
        </label>
        <label className="grid gap-1">
          <span>Week start</span>
          <input className="rounded border px-3 py-2" type="date" value={weekStart} min={format(new Date(), "yyyy-MM-dd")} max={format(addDays(new Date(), 60), "yyyy-MM-dd")} onChange={(event) => setWeekStart(event.target.value)} required />
        </label>
        <label className="grid gap-1">
          <span>Meals per day</span>
          <select className="rounded border px-3 py-2" value={mealMode} onChange={(event) => setMealMode(event.target.value as "dinner" | "lunch_dinner")}>
            <option value="dinner">Dinner only</option>
            <option value="lunch_dinner">Lunch + Dinner</option>
          </select>
        </label>
        <label className="grid gap-1">
          <span>Daily prep cap (optional, minutes)</span>
          <input className="rounded border px-3 py-2" type="number" min={10} value={timeCapMinutes} onChange={(event) => setTimeCapMinutes(event.target.value ? Number(event.target.value) : "")} />
        </label>
        <label className="grid gap-1">
          <span>Stores (comma separated keys)</span>
          <input className="rounded border px-3 py-2" value={stores} onChange={(event) => setStores(event.target.value)} />
        </label>
        <div className="md:col-span-2 flex gap-3">
          <button type="button" onClick={refreshOffers} className="rounded border border-black/10 px-4 py-2">
            Refresh offers
          </button>
          <button type="submit" className="rounded bg-[var(--brand)] px-4 py-2 text-white">
            Generate plan
          </button>
        </div>
      </form>

      <p className="text-sm text-[var(--muted)]">{status}</p>

      <div className="rounded-xl border border-black/10 bg-white p-5">
        <h2 className="text-lg font-medium">Offer connectors status</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {statusRows.map((store) => (
            <li key={store.key} className="rounded border border-black/10 px-3 py-2">
              {store.name}: {store.status?.itemCount ?? 0} offers | last refresh {store.status?.lastRefreshAt ? new Date(store.status.lastRefreshAt).toLocaleString() : "never"}
              {store.status?.lastError ? ` | error: ${store.status.lastError}` : ""}
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl border border-black/10 bg-white p-5">
        <h2 className="text-lg font-medium">Current offers</h2>
        <ul className="mt-3 grid gap-2 md:grid-cols-2">
          {offers.slice(0, 30).map((offer) => (
            <li key={offer.id} className="rounded border border-black/10 px-3 py-2 text-sm">
              <div className="font-medium">{offer.productName}</div>
              <div>{offer.store} • {offer.priceDkk} DKK • valid to {new Date(offer.validTo).toISOString().slice(0, 10)}</div>
            </li>
          ))}
          {offers.length === 0 ? <li className="text-sm text-[var(--muted)]">No offers loaded for selected stores.</li> : null}
        </ul>
      </div>
    </section>
  );
}

