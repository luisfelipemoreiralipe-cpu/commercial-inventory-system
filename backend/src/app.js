const express = require('express');

const cors = require('cors');

// Routes
const productRoutes = require('./routes/productRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const purchaseOrderRoutes = require('./routes/purchaseOrderRoutes');
const stockMovementRoutes = require('./routes/stockMovementRoutes');
const auditLogRoutes = require('./routes/auditLogRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const reportsRoutes = require('./routes/reportsRoutes');

// Middlewares
const notFoundMiddleware = require('./middlewares/notFoundMiddleware');
const errorMiddleware = require('./middlewares/errorMiddleware');


const app = express();

app.use(cors());
app.use(express.json());

app.use('/products', productRoutes);
app.use('/suppliers', supplierRoutes);
app.use('/purchase-orders', purchaseOrderRoutes);
app.use('/stock-movements', stockMovementRoutes);
app.use('/audit-logs', auditLogRoutes);
app.use('/categories', categoryRoutes);
app.use('/auth', authRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/reports', reportsRoutes);

// Fallback for undefined routes
app.use(notFoundMiddleware);

// Central error handler (must be last)
app.use(errorMiddleware);

module.exports = app;
