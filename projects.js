const express = require('express');
const { create } = require('domain');
const router = express.Router();

var driver = require('./neo4j');

/**
 * Create Project node, auto assigned ID
 */
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
        res.status(500).json({status:"Cannot create project"})
        console.log(error);
    });
    
});

/**
 * Get All Project nodes
 */
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
        res.status(500).json({status:"Cannot find projects"})
        console.log(error);
    });
});

/**
 * Get Project Node via ID
 */
router.get('/temp/:id', (req, res, next) => {
    if (req.params.id == 5) {
        res.status(200).json({
            name: "Epi_use5",
            id: 5,
            task_ob: {
                tasks: [
                    {name: "Task0", id:0, show: true},
                    {name: "Task1", id:1, show: true},
                    {name: "Task2", id:2, show: true},
                    {name: "Task3", id:3, show: true},
                    {name: "Task4", id:4, show: true},
                ],
                cons: [
                    {from: 0, to: 1},
                    {from: 0, to: 3},
                    {from: 1, to: 2},
                    {from: 2, to: 4},
                    {from: 3, to: 4},
                ]
            }
        });
    } else if (req.params.id == 6) {
        res.status(200).json({
            name: "Epi_use6",
            id: 6,
            task_ob: {
                tasks: [
                    {name: "Task0", id:0, show: true},
                    {name: "Task1", id:1, show: true},
                    {name: "Task2", id:2, show: true},
                    {name: "Task3", id:3, show: true},
                    {name: "Task4", id:4, show: true},
                    {name: "Task5", id:5, show: true},
                    {name: "Task6", id:6, show: true},
                    {name: "Task7", id:7, show: true},
                ],
                cons: [
                    {from: 0, to: 1},
                    {from: 0, to: 3},
                    {from: 0, to: 7},
                    {from: 1, to: 2},
                    {from: 2, to: 4},
                    {from: 3, to: 5},
                    {from: 6, to: 1},
                ]
            }
        });
    } else {
        res.status(400).json({
            message: "Not found"
        });
    };
});

/**
 * Get Project Node via ID
 */
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
        res.status(404).json({status:"id not found"})
        console.log(error);
    });
});

/**
 * Update Project node via ID
 */
router.post('/update/:id', (req, res, next) => {
    var session = driver.session();
    var request = {
        id: Number(req.params.id),
        name: req.body.name
    }
    session
    .run('MATCH (p:Project) WHERE ID(p) = $id UNWIND p as x SET x = {name:$name} RETURN x', request)
    .then(function(result) {
        res.status(200).json({name:result.records[0].get('x').properties.name, id:result.records[0].get('x').identity.low});
        session.close();
    })
    .catch(function(error) {
        res.status(500).json({status:"Cannot Update project"})
        console.log(error);
    });
    
});

/**
 * Delete Project node via ID
 */
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