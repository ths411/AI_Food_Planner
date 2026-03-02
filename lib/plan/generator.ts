import OpenAI from "openai";
import { addDays, formatISO, parseISO } from "date-fns";
import { zodToJsonSchema } from "zod-to-json-schema";
import type { Offer } from "@prisma/client";
import { env } from "@/lib/env";
import { generationInputSchema, mealPlanSchema, type GenerationInput, type MealPlanJson } from "@/lib/plan/schema";
import { scorePlan, type ScoreBreakdown } from "@/lib/plan/scoring";

const client = env.OPENAI_API_KEY ? new OpenAI({ apiKey: env.OPENAI_API_KEY }) : null;

function normalize(text: string) {
  return text.toLowerCase().trim();
}

function containsAllergy(ingredientName: string, allergies: string[]): boolean {
  const token = normalize(ingredientName);
  return allergies.some((allergy) => token.includes(normalize(allergy)));
}

function validateHardConstraints(plan: MealPlanJson, input: GenerationInput) {
  for (const day of plan.days) {
    let totalTime = 0;
    for (const meal of day.meals) {
      totalTime += meal.timeMinutes;
      if (meal.recipe.servings !== input.peopleCount) {
        throw new Error(`Invalid servings for ${meal.name}`);
      }
      for (const ingredient of meal.recipe.ingredients) {
        if (containsAllergy(ingredient.name, input.preferences.allergies)) {
          throw new Error(`Allergy ingredient found: ${ingredient.name}`);
        }
      }
    }
    if (input.timeCapMinutes && totalTime > input.timeCapMinutes) {
      throw new Error(`Day ${day.date} exceeds time cap`);
    }
  }
}

function buildPrompt(input: GenerationInput, offers: Offer[]) {
  const schema = zodToJsonSchema(mealPlanSchema, "MealPlan");
  const offerLines = offers.slice(0, 120).map((offer) => `${offer.storeId}: ${offer.productName} (${offer.priceDkk} DKK)`);

  return [
    "You are a meal planning system. Return valid JSON only.",
    "Hard constraints:",
    `- Exactly 7 days starting ${input.weekStart}`,
    `- Meals mode: ${input.mealMode}`,
    `- peopleCount: ${input.peopleCount} and each recipe.servings must equal peopleCount`,
    `- Exclude allergies: ${input.preferences.allergies.join(", ") || "none"}`,
    `- Exclude disliked ingredients: ${input.preferences.disliked.join(", ") || "none"}`,
    input.timeCapMinutes ? `- Total daily prep time <= ${input.timeCapMinutes}` : "- No daily prep time cap",
    "Soft constraints:",
    "- Maximize discounted ingredient usage",
    "- Reuse ingredients across days",
    "- Minimize one-off ingredients and waste",
    "- Include leftover strategy and reuse plan",
    `- Diet style: ${input.preferences.diet}`,
    `- Preferred cuisines: ${input.preferences.cuisines.join(", ") || "any"}`,
    `- Budget sensitivity: ${input.preferences.budgetSensitivity}`,
    `- Pantry items: ${input.pantryItems.map((item) => item.name).join(", ") || "none"}`,
    "Available offers:",
    ...offerLines,
    "Output JSON schema:",
    JSON.stringify(schema)
  ].join("\n");
}

function buildFallbackPlan(input: GenerationInput, offers: Offer[]): MealPlanJson {
  const weekStart = parseISO(input.weekStart);
  const mealNames = [
    "One-pot pasta with vegetables",
    "Oven tray chicken and potatoes",
    "Lentil tomato stew",
    "Fish cakes with cabbage slaw",
    "Beef and broccoli stir fry",
    "Soup with bread",
    "Leftover bowl"
  ];
  const sharedIngredients = ["Onion", "Garlic", "Carrot", "Potato", "Tomato"];

  const days = Array.from({ length: 7 }).map((_, index) => {
    const date = formatISO(addDays(weekStart, index), { representation: "date" });
    const dinner = {
      name: mealNames[index % mealNames.length],
      recipe: {
        ingredients: [
          { name: sharedIngredients[index % sharedIngredients.length], quantity: "2", unit: "pcs" },
          { name: offers[index % Math.max(offers.length, 1)]?.productName ?? "Seasonal protein", quantity: "500", unit: "g" },
          { name: "Pasta or rice", quantity: "400", unit: "g" }
        ],
        steps: [
          "Prep all vegetables.",
          "Cook protein and vegetables together.",
          "Add starch and season."
        ],
        servings: input.peopleCount
      },
      tags: ["budget", "reuse"],
      timeMinutes: Math.min(input.timeCapMinutes ?? 45, 45),
      leftovers: ["Use in next-day lunch"]
    };

    const meals = input.mealMode === "lunch_dinner"
      ? [
          {
            ...dinner,
            name: `${dinner.name} (Lunch)`
          },
          dinner
        ]
      : [dinner];

    return { date, meals };
  });

  const groceryList = [
    {
      store: "Mixed stores",
      items: sharedIngredients.map((name) => ({
        name,
        quantity: "1",
        unit: "pack",
        isOffer: offers.some((offer) => normalize(offer.productName).includes(normalize(name))),
        offerPriceDkk: offers.find((offer) => normalize(offer.productName).includes(normalize(name)))?.priceDkk,
        offerValidTo: offers.find((offer) => normalize(offer.productName).includes(normalize(name)))?.validTo.toISOString(),
        category: "Vegetables"
      }))
    }
  ];

  const reusePlan = sharedIngredients.map((ingredient) => ({
    ingredient,
    usedIn: days
      .filter((day) => day.meals.some((meal) => meal.recipe.ingredients.some((it) => it.name === ingredient)))
      .map((day) => ({ date: day.date, mealName: day.meals[0].name }))
  }));

  return {
    weekStart: input.weekStart,
    peopleCount: input.peopleCount,
    days,
    groceryList,
    wasteNotes: [
      "Shared core vegetables are reused through the week.",
      "Cook double portions once and reuse for lunch to reduce waste."
    ],
    reusePlan
  };
}

async function callModel(prompt: string): Promise<string> {
  if (!client) {
    throw new Error("OPENAI_API_KEY missing");
  }

  const completion = await client.chat.completions.create({
    model: env.OPENAI_MODEL,
    temperature: 0.5,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: "You generate strict JSON meal plans." },
      { role: "user", content: prompt }
    ]
  });

  return completion.choices[0]?.message?.content ?? "{}";
}

async function createCandidate(input: GenerationInput, offers: Offer[]): Promise<MealPlanJson> {
  const prompt = buildPrompt(input, offers);

  try {
    const raw = await callModel(prompt);
    let parsed = mealPlanSchema.parse(JSON.parse(raw));
    validateHardConstraints(parsed, input);
    return parsed;
  } catch (error) {
    if (!client) {
      return buildFallbackPlan(input, offers);
    }

    const repairPrompt = `${prompt}\nThe previous output failed validation: ${error instanceof Error ? error.message : "unknown"}. Return corrected JSON only.`;
    const repaired = await callModel(repairPrompt);
    const parsed = mealPlanSchema.parse(JSON.parse(repaired));
    validateHardConstraints(parsed, input);
    return parsed;
  }
}

export async function generateBestPlan(rawInput: unknown, offers: Offer[]) {
  const input = generationInputSchema.parse(rawInput);
  const candidates: Array<{ plan: MealPlanJson; score: ScoreBreakdown }> = [];

  for (let i = 0; i < 3; i += 1) {
    const candidate = await createCandidate(input, offers);
    const score = scorePlan(candidate, input, offers);
    candidates.push({ plan: candidate, score });
  }

  candidates.sort((a, b) => b.score.total - a.score.total);
  return {
    selected: candidates[0],
    candidates
  };
}

