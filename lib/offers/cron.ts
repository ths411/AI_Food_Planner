import cron from "node-cron";
import { env } from "@/lib/env";
import { refreshOffers } from "@/lib/offers/service";

declare global {
  // eslint-disable-next-line no-var
  var __offerRefreshCronStarted: boolean | undefined;
}

export function startOfferRefreshCron() {
  if (global.__offerRefreshCronStarted) {
    return;
  }

  global.__offerRefreshCronStarted = true;
  cron.schedule(env.CRON_REFRESH, async () => {
    try {
      await refreshOffers();
    } catch (error) {
      console.error("Offer refresh cron failed", error);
    }
  });
}

