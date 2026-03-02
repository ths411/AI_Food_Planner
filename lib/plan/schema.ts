import { z } from "zod";

export const ingredientSchema = z.object({
  name: z.string().min(1),
  quantity: z.string().min(1),
  unit: z.string().min(1)
});

export const recipeSchema = z.object({
  ingredients: z.array(ingredientSchema).min(1),
  steps: z.array(z.string().min(1)).min(1),
  servings: z.number().int().min(1)
});

export const mealSchema = z.object({
  name: z.string().min(1),
  recipe: recipeSchema,
  tags: z.array(z.string()).default([]),
  timeMinutes: z.number().int().min(5).max(240),
  leftovers: z.array(z.string()).default([])
});

export const daySchema = z.object({
  date: z.string().min(1),
  meals: z.array(mealSchema).min(1)
});

export const groceryItemSchema = z.object({
  name: z.string().min(1),
  quantity: z.string().min(1),
  unit: z.string().min(1),
  isOffer: z.boolean(),
  offerPriceDkk: z.number().optional(),
  offerValidTo: z.string().optional(),
  category: z.string().optional()
});

export const groceryStoreSchema = z.object({
  store: z.string().min(1),
  items: z.array(groceryItemSchema)
});

export const reusePlanSchema = z.object({
  ingredient: z.string().min(1),
  usedIn: z.array(
    z.object({
      date: z.string().min(1),
      mealName: z.string().min(1)
    })
  )
});

export const mealPlanSchema = z.object({
  weekStart: z.string().min(1),
  peopleCount: z.number().int().min(1),
  days: z.array(daySchema).length(7),
  groceryList: z.array(groceryStoreSchema),
  wasteNotes: z.array(z.string()),
  reusePlan: z.array(reusePlanSchema)
});

export type MealPlanJson = z.infer<typeof mealPlanSchema>;

export const generationInputSchema = z.object({
  email: z.string().email(),
  weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  peopleCount: z.number().int().min(1).max(12),
  adultsCount: z.number().int().min(0).optional(),
  childrenCount: z.number().int().min(0).optional(),
  mealMode: z.enum(["dinner", "lunch_dinner"]).default("dinner"),
  timeCapMinutes: z.number().int().min(10).max(300).optional(),
  preferences: z.object({
    cuisines: z.array(z.string()).default([]),
    disliked: z.array(z.string()).default([]),
    allergies: z.array(z.string()).default([]),
    diet: z.enum(["omnivore", "flexitarian", "vegetarian"]).default("flexitarian"),
    budgetSensitivity: z.enum(["low", "medium", "high"]).default("medium"),
    selectedStores: z.array(z.string()).default([])
  }),
  pantryItems: z.array(
    z.object({
      name: z.string(),
      quantityText: z.string().optional(),
      expiryDate: z.string().optional(),
      useUpFirst: z.boolean().optional()
    })
  ).default([])
});

export type GenerationInput = z.infer<typeof generationInputSchema>;

