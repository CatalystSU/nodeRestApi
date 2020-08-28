const express = require('express');
const router = express.Router();


router.get('/get', (req, res, next) => {
    res.status(201).json({
        message: 'Test projet get'
    });
});