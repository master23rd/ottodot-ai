CREATE TABLE "teacher_activation" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "deliveryStatus" TEXT NOT NULL DEFAULT 'PENDING',
  "deliveryAttemptedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "teacher_activation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "teacher_activation_userId_key" ON "teacher_activation"("userId");
CREATE UNIQUE INDEX "teacher_activation_tokenHash_key" ON "teacher_activation"("tokenHash");
ALTER TABLE "teacher_activation" ADD CONSTRAINT "teacher_activation_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
