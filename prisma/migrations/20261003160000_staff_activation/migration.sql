CREATE TABLE "staff_activation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "deliveryStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "deliveryAttemptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staff_activation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "staff_activation_userId_key" ON "staff_activation"("userId");
CREATE UNIQUE INDEX "staff_activation_tokenHash_key" ON "staff_activation"("tokenHash");

ALTER TABLE "staff_activation" ADD CONSTRAINT "staff_activation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
