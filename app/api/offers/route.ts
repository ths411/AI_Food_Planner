import { NextResponse } from "next/server";
import { getCurrentOffers, listOfferStatus } from "@/lib/offers/service";

export async function GET(request: Request) {
  const stores = new URL(request.url).searchParams.getAll("store");
  const [status, offers] = await Promise.all([
    listOfferStatus(),
    getCurrentOffers(stores)
  ]);

  return NextResponse.json({
    status,
    offers: offers.map((offer) => ({
      id: offer.id,
      store: offer.store.name,
      storeKey: offer.store.key,
      productName: offer.productName,
      sizeText: offer.sizeText,
      priceDkk: offer.priceDkk,
      validFrom: offer.validFrom,
      validTo: offer.validTo,
      category: offer.category
    }))
  });
}

