-- CreateTable
CREATE TABLE "Code" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "value" TEXT NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "ticket" TEXT,
    "email" TEXT,
    "usedAt" TEXT
);

-- CreateIndex
CREATE UNIQUE INDEX "Code_value_key" ON "Code"("value");

-- CreateIndex
CREATE UNIQUE INDEX "Code_ticket_key" ON "Code"("ticket");
