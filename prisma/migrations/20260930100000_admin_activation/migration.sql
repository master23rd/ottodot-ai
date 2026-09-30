ALTER TABLE "user"
  ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "activatedAt" TIMESTAMP(3);

UPDATE "user" SET "activatedAt" = "createdAt" WHERE "role" = 'SUPERADMIN';

CREATE TABLE "admin_activation" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "admin_activation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "admin_activation_userId_key" ON "admin_activation"("userId");
CREATE UNIQUE INDEX "admin_activation_tokenHash_key" ON "admin_activation"("tokenHash");
ALTER TABLE "admin_activation" ADD CONSTRAINT "admin_activation_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "admin_audit" (
  "id" TEXT NOT NULL,
  "actorId" TEXT NOT NULL,
  "targetId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "result" TEXT NOT NULL DEFAULT 'SUCCESS',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "admin_audit_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "admin_audit_targetId_createdAt_idx" ON "admin_audit"("targetId", "createdAt");
