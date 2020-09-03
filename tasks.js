const express = require('express');
const { create } = require('domain');
const router = express.Router();

var driver = require('./neo4j');

router.post('/create', (req, res, next) => {
    var session = driver.session();
    var request = {
        name: req.body.name
    }
    session
    .run('CREATE (n:Task {name:$name})', request)
    .then(function(result) {
        res.status(200).json(result);
        result.records.forEach(function(record) {
            console.log(record.get('title'))
            console.log(record)
        });
        session.close();
    })
    .catch(function(error) {
        console.log(error);
    });
});

router.get('/all', (req, res, next) => {
    var session = driver.session();
    var projects = [];
    session
    .run('MATCH (n:Project) RETURN n')
    .then(function(result) {
        result.records.forEach(function(record) {
            projects.push({name:record.get('n').properties.name, id:record.get('n').identity.low});
        });
        res.status(200).json(projects);
        session.close();
    })
    .catch(function(error) {
        console.log(error);
    });
});

module.exports = router;