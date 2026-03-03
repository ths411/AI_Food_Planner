-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "peopleCount" INTEGER NOT NULL DEFAULT 2,
    "adultsCount" INTEGER,
    "childrenCount" INTEGER,
    "preferencesJson" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PantryItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantityText" TEXT,
    "expiryDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PantryItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Store" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "StoreConnectorStatus" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storeId" TEXT NOT NULL,
    "lastRefreshAt" DATETIME,
    "lastSuccessAt" DATETIME,
    "lastError" TEXT,
    "itemCount" INTEGER NOT NULL DEFAULT 0,
    "sourceHash" TEXT,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StoreConnectorStatus_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Offer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storeId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "brand" TEXT,
    "sizeText" TEXT,
    "priceDkk" REAL NOT NULL,
    "unitPriceDkk" REAL,
    "validFrom" DATETIME NOT NULL,
    "validTo" DATETIME NOT NULL,
    "category" TEXT,
    "rawText" TEXT,
    "sourceUrl" TEXT,
    "flyerRef" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Offer_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MealPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "weekStart" DATETIME NOT NULL,
    "shareToken" TEXT NOT NULL,
    "planJson" TEXT NOT NULL,
    "scoreBreakdown" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MealPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GenerationLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GenerationLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "PantryItem_userId_idx" ON "PantryItem"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Store_key_key" ON "Store"("key");

-- CreateIndex
CREATE UNIQUE INDEX "StoreConnectorStatus_storeId_key" ON "StoreConnectorStatus"("storeId");

-- CreateIndex
CREATE INDEX "Offer_storeId_validTo_idx" ON "Offer"("storeId", "validTo");

-- CreateIndex
CREATE INDEX "Offer_productName_idx" ON "Offer"("productName");

-- CreateIndex
CREATE UNIQUE INDEX "MealPlan_shareToken_key" ON "MealPlan"("shareToken");

-- CreateIndex
CREATE INDEX "MealPlan_userId_weekStart_idx" ON "MealPlan"("userId", "weekStart");

-- CreateIndex
CREATE INDEX "GenerationLog_userId_createdAt_idx" ON "GenerationLog"("userId", "createdAt");
