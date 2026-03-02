import type { Metadata } from "next";
import "@/app/globals.css";
import TopNav from "@/components/top-nav";
import { startOfferRefreshCron } from "@/lib/offers/cron";

startOfferRefreshCron();

export const metadata: Metadata = {
  title: "AI Food Planner DK",
  description: "Weekly meal planning optimized for Danish grocery offers"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <TopNav />
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}

