import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/user";

export async function GET(request: Request) {
  const email = new URL(request.url).searchParams.get("email");
  if (!email) {
    return NextResponse.json({ error: "email is required" }, { status: 400 });
  }

  const user = await getOrCreateUser(email);
  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      peopleCount: user.peopleCount,
      adultsCount: user.adultsCount,
      childrenCount: user.childrenCount,
      preferences: JSON.parse(user.preferencesJson)
    }
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    email: string;
    peopleCount: number;
    adultsCount?: number;
    childrenCount?: number;
    preferences: Record<string, unknown>;
  };

  if (!body.email || !body.email.includes("@")) {
    return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
  }

  const user = await prisma.user.upsert({
    where: { email: body.email },
    update: {
      peopleCount: body.peopleCount,
      adultsCount: body.adultsCount,
      childrenCount: body.childrenCount,
      preferencesJson: JSON.stringify(body.preferences ?? {})
    },
    create: {
      email: body.email,
      peopleCount: body.peopleCount,
      adultsCount: body.adultsCount,
      childrenCount: body.childrenCount,
      preferencesJson: JSON.stringify(body.preferences ?? {})
    }
  });

  return NextResponse.json({ ok: true, userId: user.id });
}

