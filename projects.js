const express = require('express');
const { create } = require('domain');
const router = express.Router();

var driver = require('./neo4j');

router.post('/create', (req, res, next) => {
    var session = driver.session();

    session
    .run('CREATE ($project_name:Project {id:$id})', req)
    .then(function(result) {
        result.records.forEach(function(record) {
            console.log(record.get('title'))
            console.log(record)
        });
        session.close();
    })
    .catch(function(error) {
        console.log(error);
    });
})

router.get('/get', (req, res, next) => {
    res.status(201).json({
        message: 'Test projet get'
    });
});

module.exports = router;