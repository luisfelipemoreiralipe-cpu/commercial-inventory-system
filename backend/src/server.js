require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 3333;

app.listen(PORT, () => {
    console.log(`[SERVER] Running in ${process.env.NODE_ENV} mode.`);
    console.log(`[SERVER] Listening on port ${PORT}...`);
});
