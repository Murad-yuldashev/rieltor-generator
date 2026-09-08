-- CreateEnum
CREATE TYPE "PaymentFrequency" AS ENUM ('MONTHLY');

-- CreateEnum
CREATE TYPE "InstallmentStatus" AS ENUM ('PENDING', 'PAID');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('STUB');

-- CreateTable
CREATE TABLE "PaymentSchedule" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'SOM',
    "downPaymentSom" BIGINT NOT NULL DEFAULT 0,
    "installmentCount" INTEGER NOT NULL,
    "installmentSom" BIGINT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "frequency" "PaymentFrequency" NOT NULL DEFAULT 'MONTHLY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentInstallment" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "seq" INTEGER NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "amountSom" BIGINT NOT NULL,
    "status" "InstallmentStatus" NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentInstallment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "installmentId" TEXT NOT NULL,
    "amountSom" BIGINT NOT NULL,
    "method" "PaymentMethod" NOT NULL DEFAULT 'STUB',
    "note" TEXT,
    "createdById" TEXT NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PaymentSchedule_contractId_key" ON "PaymentSchedule"("contractId");

-- CreateIndex
CREATE INDEX "PaymentInstallment_scheduleId_idx" ON "PaymentInstallment"("scheduleId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentInstallment_scheduleId_seq_key" ON "PaymentInstallment"("scheduleId", "seq");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_installmentId_key" ON "Payment"("installmentId");

-- AddForeignKey
ALTER TABLE "PaymentSchedule" ADD CONSTRAINT "PaymentSchedule_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentInstallment" ADD CONSTRAINT "PaymentInstallment_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "PaymentSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_installmentId_fkey" FOREIGN KEY ("installmentId") REFERENCES "PaymentInstallment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
