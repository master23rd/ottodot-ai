ALTER TABLE "admin_activation"
  ADD COLUMN "deliveryStatus" TEXT NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "deliveryAttemptedAt" TIMESTAMP(3);
