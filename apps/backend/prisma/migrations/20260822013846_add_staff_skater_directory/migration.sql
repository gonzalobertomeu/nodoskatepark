-- AlterTable
ALTER TABLE "accounts" ADD COLUMN     "afeccionesDeSalud" TEXT,
ADD COLUMN     "apodo" TEXT,
ADD COLUMN     "fotoPath" TEXT;

-- CreateTable
CREATE TABLE "skater_health_audit_log" (
    "id" TEXT NOT NULL,
    "skaterAccountId" TEXT NOT NULL,
    "editedByAccountId" TEXT NOT NULL,
    "editedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "skater_health_audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "skater_health_audit_log_skaterAccountId_idx" ON "skater_health_audit_log"("skaterAccountId");

-- AddForeignKey
ALTER TABLE "skater_health_audit_log" ADD CONSTRAINT "skater_health_audit_log_skaterAccountId_fkey" FOREIGN KEY ("skaterAccountId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skater_health_audit_log" ADD CONSTRAINT "skater_health_audit_log_editedByAccountId_fkey" FOREIGN KEY ("editedByAccountId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
