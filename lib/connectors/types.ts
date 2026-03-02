export type NormalizedOffer = {
  productName: string;
  brand?: string;
  sizeText?: string;
  priceDkk: number;
  unitPriceDkk?: number;
  validFrom: string;
  validTo: string;
  category?: string;
  rawText?: string;
  sourceUrl?: string;
  flyerRef?: string;
};

export type FlyerRef = {
  id: string;
  url: string;
  validFrom?: string;
  validTo?: string;
};

export interface StoreConnector {
  storeKey: string;
  fetchLatestFlyers(): Promise<FlyerRef[]>;
  fetchOffers(flyer: FlyerRef): Promise<NormalizedOffer[]>;
}

