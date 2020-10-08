const express = require('express');
const { create } = require('domain');
const router = express.Router();

var driver = require('./neo4j');
const { waitForDebugger } = require('inspector');
const { SSL_OP_EPHEMERAL_RSA } = require('constants');

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
                    {taskname: "Task0", id:0, show: true, personincharge: "Freddie", packagemanager: "Bob", startdate: "15/10/2020", duration: 3, enddate: "01/11/2020", taskresources: "ben, fred", taskprogress: 50},
                    {taskname: "Task1", id:1, show: true, personincharge: "Henry", packagemanager: "Bob", startdate: "16/10/2020", duration: 4, enddate: "12/11/2020", taskresources: "ben, jeff", taskprogress: 23},
                    {taskname: "Task2", id:2, show: true, personincharge: "Chloe", packagemanager: "Bob", startdate: "25/10/2020", duration: 3, enddate: "15/12/2020", taskresources: "franny, fred", taskprogress: 70},
                    {taskname: "Task3", id:3, show: true, personincharge: "Lucy", packagemanager: "Bob", startdate: "15/11/2020", duration: 5, enddate: "17/11/2020", taskresources: "ben, bob", taskprogress: 50},
                    {taskname: "Task4", id:4, show: true, personincharge: "Nick", packagemanager: "Bob", startdate: "16/10/2020", duration: 3, enddate: "18/10/2020", taskresources: "joe, nic", taskprogress: 60},
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
                    {taskname: "Task0", id:0, show: true, personincharge: "Freddie", packagemanager: "Bob", startdate: "15/10/2020", duration: 3, enddate: "01/11/2020", taskresources: "ben, fred", taskprogress: 50},
                    {taskname: "Task1", id:1, show: true, personincharge: "Henry", packagemanager: "Bob", startdate: "16/10/2020", duration: 4, enddate: "12/11/2020", taskresources: "ben, jeff", taskprogress: 23},
                    {taskname: "Task2", id:2, show: true, personincharge: "Chloe", packagemanager: "Bob", startdate: "25/10/2020", duration: 3, enddate: "15/12/2020", taskresources: "franny, fred", taskprogress: 70},
                    {taskname: "Task3", id:3, show: true, personincharge: "Lucy", packagemanager: "Bob", startdate: "15/11/2020", duration: 5, enddate: "17/11/2020", taskresources: "ben, bob", taskprogress: 50},
                    {taskname: "Task4", id:4, show: true, personincharge: "Nick", packagemanager: "Bob", startdate: "16/10/2020", duration: 3, enddate: "18/10/2020", taskresources: "joe, nic", taskprogress: 60},
                    {taskname: "Task5", id:5, show: true, personincharge: "Freddie", packagemanager: "Bob", startdate: "15/10/2020", duration: 3, enddate: "01/11/2020", taskresources: "ben, fred", taskprogress: 50},
                    {taskname: "Task6", id:6, show: true, personincharge: "Henry", packagemanager: "Bob", startdate: "16/10/2020", duration: 4, enddate: "12/11/2020", taskresources: "ben, jeff", taskprogress: 23},
                    {taskname: "Task7", id:7, show: true, personincharge: "Chloe", packagemanager: "Bob", startdate: "25/10/2020", duration: 3, enddate: "15/12/2020", taskresources: "franny, fred", taskprogress: 70},
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
    let x = 0
    var session = driver.session();
    var session1 = driver.session();
    var session2 = driver.session();
    var data = {
        name: '',
        id: Number(req.params.id),
        task_ob: {
            tasks: [],
            cons: []
        }
    };
    //data.name = `poes`;
    var viewData = {};
    var jsonData = {};
    var request = {
        id: Number(req.params.id)
    }
    session
    .run('  MATCH (p:Project) WHERE ID(p) = $id \
            RETURN p', request)
    .then(function(result) {
        var str
        result.records.forEach(function(record) {
            data.name = record.get('p').properties.name;
            //projects.push({name:record.get('n').properties.name, id:record.get('n').identity.low});
            //console.log(record)
        });
        //result.records[0].get('x')
        //jsonData["name"] = result.records[0].get('p'); //.records[0]
        //console.log(result.records[0].get('p').properties.name)
        //data["name"] = result.records[0].get('p').properties.name
        //data.name = result.records[0].get('p').properties.name;
        //console.log(typeof(result.records[0].get('p').properties.name))
        //console.log(result.records[0].get('p'))
        //var str = result.records[0].get('p').properties.name; /************* BEEEEG fucking problem with name  */
        //data.name = str;
        console.log("0")
        x++
        session.close();
    })
    .catch(function(error) {
        res.status(404).json({status:"id not found"})
        console.log(error);
    });
    session1
    .run('  MATCH (p:Project) WHERE ID(p) = $id \
            MATCH (p)<-[:UNDER]-(n) \
            RETURN n', request)
    .then(function(result) {
        //result.records.forEach(function(record) {
            //projects.push({name:record.get('n').properties.name, id:record.get('n').identity.low});
            //console.log(record)
            //console.log(record.get('n'))

        //});
        console.log("1")
        jsonData["tasks"] = result;
        x++
        session1.close();
    })
    .catch(function(error) {
        res.status(404).json({status:"id not found"})
        console.log(error);
    });
    session2
    .run('  MATCH (p:Project) WHERE ID(p) = $id \
            MATCH (p)<-[:UNDER]-(n) \
            MATCH (n)<-[:UNDER]-(n1) \
            RETURN ID(n), ID(n1)', request)
    .then(function(result) {
        jsonData["conns"] = result;
        console.log("2")
        x++
        session2.close();
    })
    .catch(function(error) {
        res.status(404).json({status:"id not found"})
        console.log(error);
    });
    //while (x != 3) {
        //console.log("poes")
    //}
    res.status(200).json(data);
});



/**
 * TODO: THSI MUST GO 
 */
/**
 * Get Project Node via ID
 */
router.get('/dev/:id', (req, res, next) => {
    var session = driver.session();
    var session1 = driver.session();
    var session2 = driver.session();
    var data = {
        id: Number(req.params.id),
        task_ob: {
            tasks: [],
            cons: []
        }

    };
    var viewData = {};
    var jsonData = {};
    var request = {
        id: Number(req.params.id)
    }
    Promise.all([
        session.run('  MATCH (p:Project) WHERE ID(p) = $id \
            RETURN p', request),

        session1.run('  MATCH (p:Project) WHERE ID(p) = $id \
            MATCH (p)<-[:UNDER]-(n) \
            RETURN n', request),

        session2.run('  MATCH (p:Project) WHERE ID(p) = $id \
            MATCH (p)<-[:UNDER]-(n) \
            MATCH (n)<-[:UNDER]-(n1) \
            RETURN ID(n), ID(n1)', request)
    ])
    .then(function(results) {
        jsonData["results"] = results;
        res.status(200).json(jsonData);
        session.close();
        session1.close();
        session2.close();
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
        res.status(400).json("Project does not exist");
        session.close
        console.log(error);
    });
});

module.exports = router;