const express = require('express');
const cors = require('cors');
const notFoundMiddleware = require('./middlewares/notFoundMiddleware');
const errorMiddleware = require('./middlewares/errorMiddleware');

// Routes
const salesRoutes = require('./routes/salesRoutes');
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
const recipeRoutes = require('./routes/recipeRoutes');
const establishmentRoutes = require('./routes/establishmentRoutes');
const stockTransferRoutes = require('./routes/stockTransferRoutes');
const stockAuditRoutes = require('./routes/stockAuditRoutes');
const userRoutes = require('./routes/userRoutes');
const consumptionEventRoutes = require('./routes/consumptionEventRoutes');

const app = express();

// 🛡️ Configuração de CORS (Segurança)
const allowedOrigins = [
    'http://localhost:3000', // Ambiente de desenvolvimento (React padrão)
    'https://commercial-inventory-system.vercel.app' // ⚠️ IMPORTANTE: Atualize este link quando tiver a URL final da Vercel
];

app.use(cors({
    origin: function (origin, callback) {
        // Permite requisições sem origin (ex: Postman no back-end) ou origins que estão na lista
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Bloqueado pela política de CORS'));
        }
    },
    credentials: true // Necessário se formos usar cookies/sessões no futuro
}));

app.use(express.json());

app.use((req, res, next) => {
    console.log('➡️ REQUEST:', req.method, req.originalUrl);
    next();
});

// Route Registration
app.use('/auth', authRoutes);
app.use('/products', productRoutes);
app.use('/suppliers', supplierRoutes);
app.use('/api/purchase-orders', purchaseOrderRoutes);
app.use('/stock-movements', stockMovementRoutes);
app.use('/audit-logs', auditLogRoutes);
app.use('/categories', categoryRoutes);
// app.use('/auth', authRoutes); // Redundante, já existe na linha 54
app.use('/dashboard', dashboardRoutes);
app.use('/api', stockTransferRoutes);
app.use('/reports', reportsRoutes);
app.use('/recipes', recipeRoutes);
app.use('/stock-sectors', stockSectorRoutes);
app.use('/sales', salesRoutes);
app.use('/api', purchaseSuggestionRoutes);
app.use('/establishments', establishmentRoutes);
app.use('/stock-audits', stockAuditRoutes);
app.use('/users', userRoutes);
app.use('/consumption-events', consumptionEventRoutes);

// Fallback for undefined routes
app.use(notFoundMiddleware);

// Central error handler
app.use(errorMiddleware);

module.exports = app;