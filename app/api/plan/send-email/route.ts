import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendMealPlanEmail } from "@/lib/email/send";

export async function POST(request: Request) {
  const body = (await request.json()) as { shareToken: string; email?: string };
  if (!body.shareToken) {
    return NextResponse.json({ error: "shareToken is required" }, { status: 400 });
  }

  const mealPlan = await prisma.mealPlan.findUnique({
    where: { shareToken: body.shareToken },
    include: { user: true }
  });

  if (!mealPlan) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }

  const plan = JSON.parse(mealPlan.planJson);
  await sendMealPlanEmail({
    to: body.email ?? mealPlan.user.email,
    plan,
    shareToken: mealPlan.shareToken
  });

  return NextResponse.json({ ok: true });
}

