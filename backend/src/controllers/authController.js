exports.register = async (req, res) => {
    res.json({
        success: true,
        message: 'Rota register funcionando',
        body: req.body
    });
};