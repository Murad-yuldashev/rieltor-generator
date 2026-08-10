-- CreateTable
CREATE TABLE "Realtor" (
    "id" TEXT NOT NULL,
    "tgId" BIGINT NOT NULL,
    "tgUsername" TEXT,
    "name" TEXT NOT NULL,
    "photoUrl" TEXT,
    "phone" TEXT,
    "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "agency" TEXT,
    "username" TEXT NOT NULL,
    "registryNo" TEXT,
    "trusted" BOOLEAN NOT NULL DEFAULT false,
    "agentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Realtor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Realtor_tgId_key" ON "Realtor"("tgId");

-- CreateIndex
CREATE UNIQUE INDEX "Realtor_username_key" ON "Realtor"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Realtor_agentId_key" ON "Realtor"("agentId");

-- AddForeignKey
ALTER TABLE "Realtor" ADD CONSTRAINT "Realtor_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
