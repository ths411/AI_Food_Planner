import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { MockConnector } from "@/lib/connectors/mock-connector";
import { SallingConnector } from "@/lib/connectors/salling-connector";
import type { NormalizedOffer, StoreConnector } from "@/lib/connectors/types";

const connectors: StoreConnector[] = [new MockConnector(), new SallingConnector()];

function getConnectorMap() {
  return new Map(connectors.map((connector) => [connector.storeKey, connector]));
}

function toHash(items: NormalizedOffer[]): string {
  const raw = JSON.stringify(items.map((item) => [item.productName, item.priceDkk, item.validTo]));
  return createHash("sha256").update(raw).digest("hex");
}

export async function listOfferStatus() {
  const rows = await prisma.store.findMany({
    include: { statuses: true },
    orderBy: { name: "asc" }
  });

  return rows.map((store) => ({
    key: store.key,
    name: store.name,
    enabled: store.enabled,
    status: store.statuses[0] ?? null
  }));
}

export async function getCurrentOffers(storeKeys?: string[]) {
  const now = new Date();
  return prisma.offer.findMany({
    where: {
      validTo: { gte: now },
      store: storeKeys && storeKeys.length > 0 ? { key: { in: storeKeys } } : undefined
    },
    include: { store: true },
    orderBy: [{ store: { name: "asc" } }, { category: "asc" }, { priceDkk: "asc" }]
  });
}

export async function refreshOffers(selectedStoreKeys?: string[]) {
  const storeRows = await prisma.store.findMany({
    where: {
      enabled: true,
      key: selectedStoreKeys?.length ? { in: selectedStoreKeys } : undefined
    }
  });
  const connectorMap = getConnectorMap();

  const result: Array<{ storeKey: string; inserted: number; error?: string }> = [];

  for (const store of storeRows) {
    const connector = connectorMap.get(store.key);
    if (!connector) {
      result.push({ storeKey: store.key, inserted: 0, error: "No connector configured" });
      continue;
    }

    try {
      const flyers = await connector.fetchLatestFlyers();
      const normalized: NormalizedOffer[] = [];
      for (const flyer of flyers.slice(0, 3)) {
        const offers = await connector.fetchOffers(flyer);
        normalized.push(...offers);
      }

      const sourceHash = toHash(normalized);
      await prisma.offer.deleteMany({ where: { storeId: store.id } });

      if (normalized.length > 0) {
        await prisma.offer.createMany({
          data: normalized.map((item) => ({
            storeId: store.id,
            productName: item.productName,
            brand: item.brand,
            sizeText: item.sizeText,
            priceDkk: item.priceDkk,
            unitPriceDkk: item.unitPriceDkk,
            validFrom: new Date(item.validFrom),
            validTo: new Date(item.validTo),
            category: item.category,
            rawText: item.rawText,
            sourceUrl: item.sourceUrl,
            flyerRef: item.flyerRef
          }))
        });
      }

      await prisma.storeConnectorStatus.upsert({
        where: { storeId: store.id },
        update: {
          lastRefreshAt: new Date(),
          lastSuccessAt: new Date(),
          lastError: null,
          itemCount: normalized.length,
          sourceHash
        },
        create: {
          storeId: store.id,
          lastRefreshAt: new Date(),
          lastSuccessAt: new Date(),
          itemCount: normalized.length,
          sourceHash
        }
      });

      result.push({ storeKey: store.key, inserted: normalized.length });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      await prisma.storeConnectorStatus.upsert({
        where: { storeId: store.id },
        update: {
          lastRefreshAt: new Date(),
          lastError: message
        },
        create: {
          storeId: store.id,
          lastRefreshAt: new Date(),
          lastError: message
        }
      });
      result.push({ storeKey: store.key, inserted: 0, error: message });
    }
  }

  return result;
}

export function extractOffersFromText(storeKey: string, rawText: string): NormalizedOffer[] {
  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const today = new Date();
  const validTo = new Date(today);
  validTo.setDate(validTo.getDate() + 6);

  const offers: NormalizedOffer[] = [];
  for (const line of lines) {
    const match = line.match(/^(?<name>.+?)\s+-\s+(?<price>\d+[\.,]?\d*)\s*(kr|dkk)$/i);
    if (!match?.groups) {
      continue;
    }
    const price = Number(match.groups.price.replace(",", "."));
    if (!Number.isFinite(price)) {
      continue;
    }
    offers.push({
      productName: match.groups.name,
      priceDkk: price,
      validFrom: today.toISOString(),
      validTo: validTo.toISOString(),
      category: "Uncategorized",
      rawText: line,
      sourceUrl: "manual-upload",
      flyerRef: storeKey
    });
  }

  return offers;
}

export async function saveManualOffers(storeKey: string, offers: NormalizedOffer[]) {
  const store = await prisma.store.findUnique({ where: { key: storeKey } });
  if (!store) {
    throw new Error(`Store '${storeKey}' not found`);
  }

  await prisma.offer.createMany({
    data: offers.map((item) => ({
      storeId: store.id,
      productName: item.productName,
      brand: item.brand,
      sizeText: item.sizeText,
      priceDkk: item.priceDkk,
      unitPriceDkk: item.unitPriceDkk,
      validFrom: new Date(item.validFrom),
      validTo: new Date(item.validTo),
      category: item.category,
      rawText: item.rawText,
      sourceUrl: item.sourceUrl,
      flyerRef: item.flyerRef
    }))
  });

  await prisma.storeConnectorStatus.upsert({
    where: { storeId: store.id },
    update: {
      lastRefreshAt: new Date(),
      lastSuccessAt: new Date(),
      lastError: null,
      itemCount: offers.length,
      sourceHash: toHash(offers)
    },
    create: {
      storeId: store.id,
      lastRefreshAt: new Date(),
      lastSuccessAt: new Date(),
      itemCount: offers.length,
      sourceHash: toHash(offers)
    }
  });
}

