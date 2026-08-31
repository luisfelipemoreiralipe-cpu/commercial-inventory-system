-- Supports establishment-scoped stock history ordered by newest movement first.
CREATE INDEX "stock_movements_establishmentId_createdAt_id_idx"
ON "stock_movements"("establishmentId", "createdAt", "id");
