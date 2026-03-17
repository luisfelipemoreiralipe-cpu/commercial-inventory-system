const express = require('express');
const cors = require('cors');

// Routes
const stockSectorRoutes = require('./routes/stockSectorRoutes');
const productRoutes = require('./routes/productRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const purchaseOrderRoutes = require('./routes/purchaseOrderRoutes');
const stockMovementRoutes = require('./routes/stockMovementRoutes');
const auditLogRoutes = require('./routes/auditLogRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const reportsRoutes = require('./routes/reportsRoutes');
const purchaseSuggestionRoutes = require('./routes/purchaseSuggestionRoutes');
const recipeRoutes = require('./routes/recipeRoutes'); // ← NOVA ROTA
const establishmentRoutes = require('./routes/establishmentRoutes');
const stockTransferRoutes = require('./routes/stockTransferRoutes');
const stockAuditRoutes = require('./routes/stockAuditRoutes');


// Middlewares
const notFoundMiddleware = require('./middlewares/notFoundMiddleware');
const errorMiddleware = require('./middlewares/errorMiddleware');

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/products', productRoutes);
app.use('/suppliers', supplierRoutes);
app.use('/api/purchase-orders', purchaseOrderRoutes);
app.use('/stock-movements', stockMovementRoutes);
app.use('/audit-logs', auditLogRoutes);
app.use('/categories', categoryRoutes);
app.use('/auth', authRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/api', stockTransferRoutes);
app.use('/reports', reportsRoutes);
app.use('/recipes', recipeRoutes); // ← REGISTRO DA ROTA
app.use('/stock-sectors', stockSectorRoutes);

// Nova rota da engine de compras
app.use('/api', purchaseSuggestionRoutes);
app.use('/establishments', establishmentRoutes);
app.use('/stock-audits', stockAuditRoutes);


// Fallback for undefined routes
app.use(notFoundMiddleware);

// Central error handler
app.use(errorMiddleware);

module.exports = app;