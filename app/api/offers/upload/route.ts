import { NextResponse } from "next/server";
import { extractOffersFromText, saveManualOffers } from "@/lib/offers/service";
import { extractTextFromUpload } from "@/lib/offers/upload-parser";

export async function POST(request: Request) {
  const form = await request.formData();
  const storeKey = (form.get("storeKey") as string) || "mock";
  const file = form.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }

  const text = await extractTextFromUpload(file);
  const offers = extractOffersFromText(storeKey, text);

  if (offers.length === 0) {
    return NextResponse.json({ error: "No offers parsed from upload" }, { status: 400 });
  }

  await saveManualOffers(storeKey, offers);
  return NextResponse.json({ ok: true, inserted: offers.length });
}

