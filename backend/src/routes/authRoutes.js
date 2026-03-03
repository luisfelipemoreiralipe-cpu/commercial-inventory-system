const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.json({ message: 'Auth route funcionando' });
});

router.post('/register', (req, res) => {
    res.json({
        success: true,
        message: 'Register funcionando',
        body: req.body
    });
});

module.exports = router;