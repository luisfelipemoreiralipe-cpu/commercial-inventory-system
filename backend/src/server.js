const path = require('path');

// Força carregar o .env da pasta backend
require('dotenv').config({
    path: path.resolve(__dirname, '../.env')
});

// Logs de diagnóstico (pode remover depois)
console.log("CWD:", process.cwd());
console.log("__dirname:", __dirname);
console.log("JWT:", process.env.JWT_SECRET);
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("ENV COMPLETO:", process.env);

const app = require('./app');

const PORT = process.env.PORT || 3333;

app.listen(PORT, () => {
    console.log(`[SERVER] Running in ${process.env.NODE_ENV} mode.`);
    console.log(`[SERVER] Listening on port ${PORT}...`);
});