const express = require('express');
const cors = require('cors');

const app = express();

// ─────────────────────────────────────────────
// Middlewares globais
// ─────────────────────────────────────────────

app.use(cors());
app.use(express.json());

// ─────────────────────────────────────────────
// Routes
// ─────────────────────────────────────────────

// Core
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

// Catalog
const categoryRoutes = require('./routes/categoryRoutes');
const productRoutes = require('./routes/productRoutes');
const supplierRoutes = require('./routes/supplierRoutes');

// Operations
const purchaseOrderRoutes = require('./routes/purchaseOrderRoutes');
const stockMovementRoutes = require('./routes/stockMovementRoutes');

// Production
const recipeRoutes = require('./routes/recipeRoutes');

// Reports
const reportsRoutes = require('./routes/reportsRoutes');

// Organization
const establishmentRoutes = require('./routes/establishmentRoutes');

// Smart Engine
const purchaseSuggestionRoutes = require('./routes/purchaseSuggestionRoutes');

// Audit
const auditLogRoutes = require('./routes/auditLogRoutes');

// ─────────────────────────────────────────────
// Route registration
// ─────────────────────────────────────────────

app.use('/auth', authRoutes);
app.use('/dashboard', dashboardRoutes);

app.use('/categories', categoryRoutes);
app.use('/products', productRoutes);
app.use('/suppliers', supplierRoutes);

app.use('/purchase-orders', purchaseOrderRoutes);
app.use('/stock-movements', stockMovementRoutes);

app.use('/recipes', recipeRoutes);

app.use('/reports', reportsRoutes);

app.use('/establishments', establishmentRoutes);

app.use('/audit-logs', auditLogRoutes);

// Engine de compras inteligentes
app.use('/api', purchaseSuggestionRoutes);

// ─────────────────────────────────────────────
// Error Handling
// ─────────────────────────────────────────────

const notFoundMiddleware = require('./middlewares/notFoundMiddleware');
const errorMiddleware = require('./middlewares/errorMiddleware');

app.use(notFoundMiddleware);
app.use(errorMiddleware);

module.exports = app;