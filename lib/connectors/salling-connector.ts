import { addDays, formatISO, startOfDay } from "date-fns";
import { env } from "@/lib/env";
import type { FlyerRef, NormalizedOffer, StoreConnector } from "@/lib/connectors/types";

type SallingOffer = {
  description?: string;
  offer?: string;
  brand?: string;
  size?: string;
  price?: number;
  validFrom?: string;
  validTo?: string;
  image?: string;
  category?: string;
};

export class SallingConnector implements StoreConnector {
  storeKey = "foetex";

  async fetchLatestFlyers(): Promise<FlyerRef[]> {
    const now = startOfDay(new Date());
    return [
      {
        id: `salling-${formatISO(now, { representation: "date" })}`,
        url: `${env.SALLING_API_BASE_URL}/offers`,
        validFrom: formatISO(now, { representation: "date" }),
        validTo: formatISO(addDays(now, 6), { representation: "date" })
      }
    ];
  }

  async fetchOffers(_flyer: FlyerRef): Promise<NormalizedOffer[]> {
    if (!env.SALLING_API_KEY) {
      return [];
    }

    const response = await fetch(`${env.SALLING_API_BASE_URL}/offers`, {
      headers: {
        "Authorization": `Bearer ${env.SALLING_API_KEY}`,
        "User-Agent": "AI-Food-Planner-MVP/1.0"
      },
      next: { revalidate: 3600 }
    });

    if (!response.ok) {
      return [];
    }

    const payload = (await response.json()) as { offers?: SallingOffer[] };
    const offers = payload.offers ?? [];

    return offers
      .filter((item) => Number.isFinite(item.price))
      .slice(0, 120)
      .map((item) => ({
        productName: item.description ?? item.offer ?? "Unknown product",
        brand: item.brand,
        sizeText: item.size,
        priceDkk: Number(item.price),
        validFrom: item.validFrom ?? formatISO(startOfDay(new Date())),
        validTo: item.validTo ?? formatISO(addDays(startOfDay(new Date()), 6)),
        category: item.category,
        rawText: item.offer,
        sourceUrl: item.image,
        flyerRef: "salling-api"
      }));
  }
}

