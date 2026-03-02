import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/user";

export async function GET(request: Request) {
  const email = new URL(request.url).searchParams.get("email");
  if (!email) {
    return NextResponse.json({ error: "email is required" }, { status: 400 });
  }

  const user = await getOrCreateUser(email);
  const pantry = await prisma.pantryItem.findMany({
    where: { userId: user.id },
    orderBy: [{ expiryDate: "asc" }, { createdAt: "desc" }]
  });

  return NextResponse.json({ pantry });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    email: string;
    name: string;
    quantityText?: string;
    expiryDate?: string;
  };

  if (!body.email || !body.name) {
    return NextResponse.json({ error: "email and item name are required" }, { status: 400 });
  }

  const user = await getOrCreateUser(body.email);
  const item = await prisma.pantryItem.create({
    data: {
      userId: user.id,
      name: body.name,
      quantityText: body.quantityText,
      expiryDate: body.expiryDate ? new Date(body.expiryDate) : null
    }
  });

  return NextResponse.json({ ok: true, item });
}

export async function DELETE(request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }
  await prisma.pantryItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

