-- CreateTable
CREATE TABLE "MortgageProgram" (
    "id" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "programName" TEXT NOT NULL,
    "rateBps" INTEGER NOT NULL,
    "maxTermMonths" INTEGER NOT NULL,
    "minDownBps" INTEGER NOT NULL,
    "maxAmountSom" BIGINT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MortgageProgram_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MortgageProgram_active_position_idx" ON "MortgageProgram"("active", "position");
