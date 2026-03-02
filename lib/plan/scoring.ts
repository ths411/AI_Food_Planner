import type { Offer } from "@prisma/client";
import type { GenerationInput, MealPlanJson } from "@/lib/plan/schema";

export type ScoreBreakdown = {
  total: number;
  offerMatchScore: number;
  overlapScore: number;
  wastePenalty: number;
  pantryUtilization: number;
};

function normalize(text: string) {
  return text.toLowerCase().trim();
}

export function scorePlan(plan: MealPlanJson, input: GenerationInput, offers: Offer[]): ScoreBreakdown {
  const ingredientUsage = new Map<string, number>();
  const offerTokens = new Set(offers.map((offer) => normalize(offer.productName)));
  const pantryTokens = new Set(input.pantryItems.map((item) => normalize(item.name)));

  let ingredientCount = 0;
  let offerMatches = 0;
  let pantryMatches = 0;

  for (const day of plan.days) {
    for (const meal of day.meals) {
      for (const ingredient of meal.recipe.ingredients) {
        const token = normalize(ingredient.name);
        ingredientCount += 1;
        ingredientUsage.set(token, (ingredientUsage.get(token) ?? 0) + 1);

        if ([...offerTokens].some((offerName) => token.includes(offerName) || offerName.includes(token))) {
          offerMatches += 1;
        }
        if ([...pantryTokens].some((pantryName) => token.includes(pantryName) || pantryName.includes(token))) {
          pantryMatches += 1;
        }
      }
    }
  }

  const reusedIngredients = [...ingredientUsage.values()].filter((count) => count >= 2).length;
  const singleUseIngredients = [...ingredientUsage.values()].filter((count) => count === 1).length;

  const offerMatchScore = ingredientCount ? offerMatches / ingredientCount : 0;
  const overlapScore = ingredientUsage.size ? reusedIngredients / ingredientUsage.size : 0;
  const wastePenalty = ingredientUsage.size ? singleUseIngredients / ingredientUsage.size : 0;
  const pantryUtilization = ingredientCount ? pantryMatches / ingredientCount : 0;

  const budgetWeight = input.preferences.budgetSensitivity === "high" ? 0.5 : input.preferences.budgetSensitivity === "medium" ? 0.35 : 0.2;
  const total =
    budgetWeight * offerMatchScore +
    0.3 * overlapScore +
    0.25 * pantryUtilization -
    0.25 * wastePenalty;

  return {
    total,
    offerMatchScore,
    overlapScore,
    wastePenalty,
    pantryUtilization
  };
}

