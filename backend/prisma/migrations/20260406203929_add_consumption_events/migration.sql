-- CreateTable
CREATE TABLE "consumption_events" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "establishmentId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "consumption_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consumption_event_items" (
    "id" UUID NOT NULL,
    "eventId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "withdrawnQty" DECIMAL(12,3) NOT NULL,
    "returnedQty" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "unitCost" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consumption_event_items_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "consumption_events" ADD CONSTRAINT "consumption_events_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consumption_event_items" ADD CONSTRAINT "consumption_event_items_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "consumption_events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consumption_event_items" ADD CONSTRAINT "consumption_event_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
