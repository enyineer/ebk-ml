-- CreateTable
CREATE TABLE "Ad" (
    "id" TEXT NOT NULL,
    "ebkId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "urlId" TEXT NOT NULL,
    "price" INTEGER,
    "isVB" BOOLEAN NOT NULL,
    "views" INTEGER NOT NULL,
    "locationZip" INTEGER NOT NULL,
    "sellerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Seller" (
    "id" TEXT NOT NULL,
    "ebkId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isPrivateSeller" BOOLEAN NOT NULL,
    "rating" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Seller_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdDetailValueEntries" (
    "id" TEXT NOT NULL,
    "adDetailValueId" TEXT NOT NULL,
    "adId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdDetailValueEntries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExtraEntries" (
    "id" TEXT NOT NULL,
    "extraId" TEXT NOT NULL,
    "adId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExtraEntries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdDetailValue" (
    "id" TEXT NOT NULL,
    "adDetailId" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdDetailValue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdDetail" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Extra" (
    "id" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Extra_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Ad_ebkId_key" ON "Ad"("ebkId");

-- CreateIndex
CREATE UNIQUE INDEX "Seller_ebkId_key" ON "Seller"("ebkId");

-- CreateIndex
CREATE UNIQUE INDEX "AdDetailValue_adDetailId_value_key" ON "AdDetailValue"("adDetailId", "value");

-- CreateIndex
CREATE UNIQUE INDEX "AdDetail_name_key" ON "AdDetail"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Extra_value_key" ON "Extra"("value");

-- AddForeignKey
ALTER TABLE "Ad" ADD CONSTRAINT "Ad_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "Seller"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdDetailValueEntries" ADD CONSTRAINT "AdDetailValueEntries_adDetailValueId_fkey" FOREIGN KEY ("adDetailValueId") REFERENCES "AdDetailValue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdDetailValueEntries" ADD CONSTRAINT "AdDetailValueEntries_adId_fkey" FOREIGN KEY ("adId") REFERENCES "Ad"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExtraEntries" ADD CONSTRAINT "ExtraEntries_extraId_fkey" FOREIGN KEY ("extraId") REFERENCES "Extra"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExtraEntries" ADD CONSTRAINT "ExtraEntries_adId_fkey" FOREIGN KEY ("adId") REFERENCES "Ad"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdDetailValue" ADD CONSTRAINT "AdDetailValue_adDetailId_fkey" FOREIGN KEY ("adDetailId") REFERENCES "AdDetail"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
