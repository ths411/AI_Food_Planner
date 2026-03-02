import { addDays, formatISO, startOfDay } from "date-fns";
import type { FlyerRef, NormalizedOffer, StoreConnector } from "@/lib/connectors/types";

export class MockConnector implements StoreConnector {
  storeKey = "mock";

  async fetchLatestFlyers(): Promise<FlyerRef[]> {
    const now = startOfDay(new Date());
    return [
      {
        id: `mock-${formatISO(now, { representation: "date" })}`,
        url: "mock://flyer/weekly",
        validFrom: formatISO(now, { representation: "date" }),
        validTo: formatISO(addDays(now, 6), { representation: "date" })
      }
    ];
  }

  async fetchOffers(_flyer: FlyerRef): Promise<NormalizedOffer[]> {
    const now = startOfDay(new Date());
    return [
      {
        productName: "Salmon fillet",
        sizeText: "400 g",
        priceDkk: 45,
        unitPriceDkk: 112.5,
        validFrom: formatISO(now),
        validTo: formatISO(addDays(now, 6)),
        category: "Protein",
        rawText: "Salmon fillet 400 g for 45 DKK",
        sourceUrl: "mock://flyer/weekly",
        flyerRef: "weekly"
      },
      {
        productName: "Potatoes",
        sizeText: "2 kg",
        priceDkk: 19,
        unitPriceDkk: 9.5,
        validFrom: formatISO(now),
        validTo: formatISO(addDays(now, 6)),
        category: "Vegetables",
        rawText: "Potatoes 2 kg for 19 DKK",
        sourceUrl: "mock://flyer/weekly",
        flyerRef: "weekly"
      },
      {
        productName: "Greek yogurt",
        sizeText: "1 kg",
        priceDkk: 22,
        unitPriceDkk: 22,
        validFrom: formatISO(now),
        validTo: formatISO(addDays(now, 6)),
        category: "Dairy",
        rawText: "Greek yogurt 1 kg for 22 DKK",
        sourceUrl: "mock://flyer/weekly",
        flyerRef: "weekly"
      }
    ];
  }
}

