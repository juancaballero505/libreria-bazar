/*
  Warnings:

  - You are about to drop the column `code` on the `Promotion` table. All the data in the column will be lost.
  - You are about to drop the column `productId` on the `Promotion` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Promotion` table. All the data in the column will be lost.
  - You are about to drop the column `value` on the `Promotion` table. All the data in the column will be lost.
  - Added the required column `porcentaje` to the `Promotion` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "PromotionProduct" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "promotionId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    CONSTRAINT "PromotionProduct_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "Promotion" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PromotionProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Promotion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "porcentaje" INTEGER NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Promotion" ("active", "endDate", "id", "name", "startDate") SELECT "active", "endDate", "id", "name", "startDate" FROM "Promotion";
DROP TABLE "Promotion";
ALTER TABLE "new_Promotion" RENAME TO "Promotion";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "PromotionProduct_promotionId_productId_key" ON "PromotionProduct"("promotionId", "productId");
