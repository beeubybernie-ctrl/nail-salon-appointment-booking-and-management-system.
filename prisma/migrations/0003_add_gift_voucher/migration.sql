-- CreateTable
CREATE TABLE "GiftVoucher" (
    "id" TEXT NOT NULL,
    "voucherNo" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "recipientName" TEXT NOT NULL,
    "recipientPhone" TEXT,
    "message" TEXT,
    "buyerName" TEXT,
    "buyerPhone" TEXT,
    "buyerEmail" TEXT,
    "status" TEXT NOT NULL DEFAULT 'REQUESTED',
    "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "redeemedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GiftVoucher_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GiftVoucher_voucherNo_key" ON "GiftVoucher"("voucherNo");