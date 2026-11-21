/*
  Warnings:

  - You are about to drop the column `filename` on the `PrintJob` table. All the data in the column will be lost.
  - Added the required column `pages` to the `PrintJob` table without a default value. This is not possible if the table is not empty.
  - Added the required column `price` to the `PrintJob` table without a default value. This is not possible if the table is not empty.
  - Added the required column `storagePath` to the `PrintJob` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PrintJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT,
    "originalName" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "pages" INTEGER NOT NULL,
    "copies" INTEGER NOT NULL DEFAULT 1,
    "color" BOOLEAN NOT NULL DEFAULT false,
    "duplex" BOOLEAN NOT NULL DEFAULT false,
    "paper" TEXT NOT NULL DEFAULT 'a4',
    "price" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pendiente',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueAt" DATETIME,
    "printedAt" DATETIME,
    CONSTRAINT "PrintJob_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_PrintJob" ("copies", "createdAt", "id", "originalName", "printedAt", "status") SELECT "copies", "createdAt", "id", "originalName", "printedAt", "status" FROM "PrintJob";
DROP TABLE "PrintJob";
ALTER TABLE "new_PrintJob" RENAME TO "PrintJob";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
