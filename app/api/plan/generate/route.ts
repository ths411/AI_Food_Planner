import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { generateBestPlan } from "@/lib/plan/generator";
import { createShareToken } from "@/lib/token";
import { getCurrentOffers } from "@/lib/offers/service";
import { getOrCreateUser, checkGenerationRateLimit } from "@/lib/user";
import { sendMealPlanEmail } from "@/lib/email/send";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const user = await getOrCreateUser(body.email);

    const rate = await checkGenerationRateLimit(user.id, env.PLAN_RATE_LIMIT_PER_HOUR);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: `Rate limit exceeded. Used ${rate.used}/${rate.limit} in last hour.` },
        { status: 429 }
      );
    }

    const pantryItems = await prisma.pantryItem.findMany({ where: { userId: user.id } });
    const storeKeys = Array.isArray(body.preferences?.selectedStores) ? body.preferences.selectedStores : [];
    const offers = await getCurrentOffers(storeKeys);

    const { selected, candidates } = await generateBestPlan(
      {
        ...body,
        pantryItems: pantryItems.map((item) => ({
          name: item.name,
          quantityText: item.quantityText ?? undefined,
          expiryDate: item.expiryDate?.toISOString()
        }))
      },
      offers
    );

    const shareToken = createShareToken();
    const mealPlan = await prisma.mealPlan.create({
      data: {
        userId: user.id,
        weekStart: new Date(selected.plan.weekStart),
        shareToken,
        planJson: JSON.stringify(selected.plan),
        scoreBreakdown: JSON.stringify(selected.score)
      }
    });

    await prisma.generationLog.create({ data: { userId: user.id } });

    let emailed = false;
    let emailError: string | null = null;
    try {
      await sendMealPlanEmail({
        to: user.email,
        plan: selected.plan,
        shareToken
      });
      emailed = true;
    } catch (error) {
      emailError = error instanceof Error ? error.message : "Email send failed";
    }

    return NextResponse.json({
      ok: true,
      planId: mealPlan.id,
      shareToken,
      score: selected.score,
      candidateScores: candidates.map((candidate) => candidate.score),
      emailed,
      emailError
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Plan generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

