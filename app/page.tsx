import Link from "next/link";

export default function HomePage() {
  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-black/10 bg-[var(--card)] p-8 shadow-sm">
        <p className="text-sm uppercase tracking-wide text-[var(--brand)]">Danish discount-aware weekly meal planning</p>
        <h1 className="mt-2 text-4xl font-semibold">Generate smart weekly plans from tilbudsaviser</h1>
        <p className="mt-4 max-w-3xl text-[var(--muted)]">
          Build a 7-day meal plan with pantry usage, discount offers, ingredient reuse, and low food waste.
          Plans include recipes, grocery list by store, leftover strategy, and email delivery.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link className="rounded-lg bg-[var(--brand)] px-4 py-2 text-white" href="/generate">
            Generate Plan
          </Link>
          <Link className="rounded-lg border border-black/10 bg-white px-4 py-2" href="/settings">
            Configure Settings
          </Link>
        </div>
      </div>
    </section>
  );
}

