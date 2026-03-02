import { notFound } from "next/navigation";
import SendEmailButton from "@/components/send-email-button";
import { prisma } from "@/lib/prisma";

export default async function ResultPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const row = await prisma.mealPlan.findUnique({
    where: { shareToken: id },
    include: { user: true }
  });

  if (!row) {
    notFound();
  }

  const plan = JSON.parse(row.planJson) as {
    weekStart: string;
    peopleCount: number;
    days: Array<{ date: string; meals: Array<{ name: string; tags: string[]; timeMinutes: number; leftovers: string[]; recipe: { ingredients: Array<{ name: string; quantity: string; unit: string }>; steps: string[] } }> }>;
    groceryList: Array<{ store: string; items: Array<{ name: string; quantity: string; unit: string; category?: string; isOffer: boolean; offerPriceDkk?: number }> }>;
    wasteNotes: string[];
    reusePlan: Array<{ ingredient: string; usedIn: Array<{ date: string; mealName: string }> }>;
  };

  return (
    <section className="space-y-6">
      <div className="rounded-xl border border-black/10 bg-white p-5">
        <h1 className="text-2xl font-semibold">Meal Plan Result</h1>
        <p className="text-sm text-[var(--muted)]">Week start {plan.weekStart} � {plan.peopleCount} people � {row.user.email}</p>
        <div className="mt-4">
          <SendEmailButton shareToken={row.shareToken} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {plan.days.map((day) => (
          <article key={day.date} className="rounded-xl border border-black/10 bg-white p-4">
            <h2 className="text-lg font-medium">{day.date}</h2>
            <div className="mt-3 space-y-3">
              {day.meals.map((meal) => (
                <details key={`${day.date}-${meal.name}`} className="rounded border border-black/10 px-3 py-2">
                  <summary className="cursor-pointer font-medium">{meal.name} ({meal.timeMinutes} min)</summary>
                  <p className="mt-2 text-xs text-[var(--muted)]">Tags: {meal.tags.join(", ") || "none"}</p>
                  <ul className="mt-2 list-disc pl-5 text-sm">
                    {meal.recipe.ingredients.map((ingredient) => (
                      <li key={`${meal.name}-${ingredient.name}`}>{ingredient.quantity} {ingredient.unit} {ingredient.name}</li>
                    ))}
                  </ul>
                  <ol className="mt-2 list-decimal pl-5 text-sm">
                    {meal.recipe.steps.map((step) => (
                      <li key={`${meal.name}-${step.slice(0, 12)}`}>{step}</li>
                    ))}
                  </ol>
                  {meal.leftovers.length > 0 ? (
                    <p className="mt-2 text-xs text-[var(--brand)]">Leftovers: {meal.leftovers.join(", ")}</p>
                  ) : null}
                </details>
              ))}
            </div>
          </article>
        ))}
      </div>

      <div className="rounded-xl border border-black/10 bg-white p-5">
        <h2 className="text-xl font-semibold">Grocery List by Store</h2>
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          {plan.groceryList.map((group) => (
            <div key={group.store} className="rounded border border-black/10 p-3">
              <h3 className="font-medium">{group.store}</h3>
              <ul className="mt-2 space-y-1 text-sm">
                {group.items.map((item) => (
                  <li key={`${group.store}-${item.name}`}>
                    {item.name} - {item.quantity} {item.unit} {item.isOffer ? `� on offer ${item.offerPriceDkk ?? ""} DKK` : ""}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-black/10 bg-white p-5">
          <h2 className="text-xl font-semibold">Use-up timeline</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {plan.reusePlan.map((item) => (
              <li key={item.ingredient} className="rounded border border-black/10 px-3 py-2">
                <strong>{item.ingredient}:</strong> {item.usedIn.map((use) => `${use.date} (${use.mealName})`).join(", ")}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-black/10 bg-white p-5">
          <h2 className="text-xl font-semibold">Waste score explanation</h2>
          <ul className="mt-3 list-disc pl-5 text-sm">
            {plan.wasteNotes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
