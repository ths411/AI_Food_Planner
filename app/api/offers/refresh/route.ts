import { NextResponse } from "next/server";
import { refreshOffers } from "@/lib/offers/service";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { stores?: string[] };
  const result = await refreshOffers(body.stores);
  return NextResponse.json({ ok: true, result });
}

