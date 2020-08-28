const express = require('express');
const { create } = require('domain');
const router = express.Router();


router.get('/get', (req, res, next) => {
    res.status(201).json({
        message: 'Test projet get'
    });
});

module.exports = router;
