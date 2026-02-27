const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const purchaseOrderRoutes = require('./routes/purchaseOrderRoutes');
const stockMovementRoutes = require('./routes/stockMovementRoutes');
const auditLogRoutes = require('./routes/auditLogRoutes');
const categoryRoutes = require('./routes/categoryRoutes');



const app = express();

app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);

app.use('/products', productRoutes);
app.use('/suppliers', supplierRoutes);
app.use('/purchase-orders', purchaseOrderRoutes);
app.use('/stock-movements', stockMovementRoutes);
app.use('/audit-logs', auditLogRoutes);
app.use('/categories', categoryRoutes);

module.exports = app;