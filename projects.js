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
    .run('CREATE (n:Project {name:$name})', request)
    .then(function(result) {
        res.status(200).json(result);
        result.records.forEach(function(record) {
            console.log(record.get('title'))
            console.log(record)
        });
        session.close();
    })
    .catch(function(error) {
        res.status(500)
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
        res.status(500)
        console.log(error);
    });
});

router.get('/:id', (req, res, next) => {
    var session = driver.session();
    var request = {
        id: Number(req.params.id)
    }
    session
    .run('MATCH (p:Project) WHERE ID(p) = $id UNWIND p as x RETURN x', request)
    .then(function(result) {
        res.status(200).json({name:result.records[0].get('x').properties.name, id:result.records[0].get('x').identity.low});
        session.close();
    })
    .catch(function(error) {
        res.status(404)
        console.log(error);
    });
});

router.delete('/:id', (req, res, next) => {
    var session = driver.session();
    var request = {
        id: Number(req.params.id)
    }
    session
    .run('MATCH (n:Project) WHERE ID(n) = $id DELETE n', request)
    .then(function() {
        res.status(200).json("Deleted Project");
        session.close;
    })
    .catch(function(error) {
        console.log(error);
    });
});

module.exports = router;