-- CreateIndex
CREATE INDEX "audit_logs_establishmentId_idx" ON "audit_logs"("establishmentId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "consumption_event_items_eventId_idx" ON "consumption_event_items"("eventId");

-- CreateIndex
CREATE INDEX "consumption_event_items_productId_idx" ON "consumption_event_items"("productId");

-- CreateIndex
CREATE INDEX "consumption_events_establishmentId_idx" ON "consumption_events"("establishmentId");

-- CreateIndex
CREATE INDEX "purchase_orders_establishmentId_idx" ON "purchase_orders"("establishmentId");

-- CreateIndex
CREATE INDEX "purchase_orders_createdAt_idx" ON "purchase_orders"("createdAt");

-- CreateIndex
CREATE INDEX "stock_audits_establishmentId_idx" ON "stock_audits"("establishmentId");

-- CreateIndex
CREATE INDEX "stock_audits_createdAt_idx" ON "stock_audits"("createdAt");

-- CreateIndex
CREATE INDEX "stock_audits_createdBy_idx" ON "stock_audits"("createdBy");

-- CreateIndex
CREATE INDEX "stock_movements_establishmentId_idx" ON "stock_movements"("establishmentId");

-- CreateIndex
CREATE INDEX "stock_movements_productId_idx" ON "stock_movements"("productId");

-- CreateIndex
CREATE INDEX "stock_movements_createdAt_idx" ON "stock_movements"("createdAt");
