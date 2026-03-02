import { PrismaClient } from "@prisma/client";
import { addDays, startOfDay } from "date-fns";

const prisma = new PrismaClient();

async function main() {
  const stores = [
    { key: "mock", name: "Mock Store" },
    { key: "netto", name: "Netto" },
    { key: "foetex", name: "Føtex" },
    { key: "rema1000", name: "Rema 1000" }
  ];

  for (const store of stores) {
    const row = await prisma.store.upsert({
      where: { key: store.key },
      update: { name: store.name, enabled: true },
      create: { key: store.key, name: store.name, enabled: true }
    });

    await prisma.storeConnectorStatus.upsert({
      where: { storeId: row.id },
      update: {},
      create: { storeId: row.id }
    });
  }

  const user = await prisma.user.upsert({
    where: { email: "demo@example.com" },
    update: {},
    create: {
      email: "demo@example.com",
      peopleCount: 2,
      preferencesJson: JSON.stringify({
        cuisines: ["nordic", "italian"],
        disliked: ["olives"],
        allergies: ["peanut"],
        diet: "flexitarian",
        budgetSensitivity: "high",
        selectedStores: ["mock", "netto"]
      })
    }
  });

  await prisma.pantryItem.createMany({
    data: [
      { userId: user.id, name: "Pasta", quantityText: "500 g", expiryDate: addDays(startOfDay(new Date()), 60) },
      { userId: user.id, name: "Carrots", quantityText: "4 pcs", expiryDate: addDays(startOfDay(new Date()), 4) },
      { userId: user.id, name: "Canned tomatoes", quantityText: "2 cans", expiryDate: addDays(startOfDay(new Date()), 180) }
    ]
  });

  const mockStore = await prisma.store.findUniqueOrThrow({ where: { key: "mock" } });
  const baseDate = startOfDay(new Date());

  await prisma.offer.createMany({
    data: [
      {
        storeId: mockStore.id,
        productName: "Chicken thighs",
        brand: "MockFarm",
        sizeText: "900 g",
        priceDkk: 49,
        unitPriceDkk: 54.44,
        validFrom: baseDate,
        validTo: addDays(baseDate, 6),
        category: "Protein",
        rawText: "Chicken thighs 900 g - 49 DKK",
        sourceUrl: "seed://mock"
      },
      {
        storeId: mockStore.id,
        productName: "Broccoli",
        sizeText: "500 g",
        priceDkk: 12,
        unitPriceDkk: 24,
        validFrom: baseDate,
        validTo: addDays(baseDate, 6),
        category: "Vegetables",
        rawText: "Broccoli 500 g - 12 DKK",
        sourceUrl: "seed://mock"
      },
      {
        storeId: mockStore.id,
        productName: "Minced beef 8%",
        sizeText: "500 g",
        priceDkk: 35,
        unitPriceDkk: 70,
        validFrom: baseDate,
        validTo: addDays(baseDate, 6),
        category: "Protein",
        rawText: "Minced beef 500 g - 35 DKK",
        sourceUrl: "seed://mock"
      }
    ]
  });

  console.log("Seed complete");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

