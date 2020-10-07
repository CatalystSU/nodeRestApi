const express = require('express');
const { create } = require('domain');
const router = express.Router();

var driver = require('./neo4j');

/**
 * Create Task node
 */
router.post('/dev/create', (req, res, next) => {
    var session = driver.session();
    var request = {
        project_id: req.body.project_id,
        taskname: req.body.taskname,
        personincharge: req.body.personincharge,
        packagemanager: req.body.packagemanager,
        startdate: req.body.startdate,
        duration: req.body.duration,
        enddate: req.body.enddate,
        taskresources: req.body.taskresources,
        taskprogress: req.body.taskprogress
    }
    session
    .run('MATCH (p:Project) WHERE ID(p) = $project_id\
        CREATE (t:Task {\
        taskname:$taskname, \
        personincharge:$personincharge, \
        packagemanager:$packagemanager, \
        startdate: $startdate, \
        duration:$duration, \
        enddate:$enddate, \
        taskresources:$taskresources, \
        taskprogress:$taskprogress}) \
        CREATE (t)-[:UNDER {task_id:[ID(t)]}]->(p)', request)
    .then(function(result) {
        res.status(200).json(result);
        result.records.forEach(function(record) {
            console.log(record.get('title'))
            console.log(record)
        });
        session.close();
    })
    .catch(function(error) {
        res.status(500).json({status:"Cannot create task"})
        console.log(error);
    });
});

router.post('/create', (req, res, next) => {
    var session = driver.session();
    var request = {
        project_id: req.body.project_id,
        taskname: req.body.taskname,
        personincharge: req.body.personincharge,
        packagemanager: req.body.packagemanager,
        startdate: req.body.startdate,
        duration: req.body.duration,
        enddate: req.body.enddate,
        taskresources: req.body.taskresources,
        taskprogress: req.body.taskprogress
    }
    session
    .run('MATCH (p:Project) WHERE ID(p) = $project_id\
        CREATE (t:Task {\
        taskname:$taskname, \
        personincharge:$personincharge, \
        packagemanager:$packagemanager, \
        startdate: $startdate, \
        duration:$duration, \
        enddate:$enddate, \
        taskresources:$taskresources, \
        taskprogress:$taskprogress}) \
        CREATE (t)-[:UNDER {task_id:[ID(t)]}]->(p)', request)
    .then(function(result) {
        res.status(200).json({status:"Created Task"});
        result.records.forEach(function(record) {
            console.log(record.get('title'));
            console.log(record);
        });
        session.close();
    })
    .catch(function(error) {
        res.status(500).json({status:"Cannot create task"});
        console.log(error);
    });
});
/**
 * Create link between tasks
 */
router.post('/link', (req, res, next) => {
    var session = driver.session();
    var request = {
        task_id1: req.body.task_id1,
        task_id2: req.body.task_id2
    };
    session
    .run('MATCH (t1:Task) WHERE ID(t1) = $task_id1\
        MATCH (t2:Task) WHERE ID(t2) = $task_id2\
        CREATE (t1)-[:UNDER]->(t2)', request)
    .then(function(result) {
        res.status(200).json({status:"Created Link"});
        result.records.forEach(function(record) {
            console.log(record.get('title'));
            console.log(record);
        });
        session.close();
    })
    .catch(function(error) {
        res.status(500).json({status:"Cannot create Link"});
        console.log(error);
    });
});


/**
 * Update Task node via ID
 */
router.post('/update/:id', (req, res, next) => {
    var session = driver.session();
    var request = {
        id: Number(req.params.id),
        name: req.body.name
    }
    session
    .run('MATCH (p:Task) WHERE ID(p) = $id UNWIND p as x SET x = {name:$name} RETURN x', request)
    .then(function(result) {
        res.status(200).json({name:result.records[0].get('x').properties.name, id:result.records[0].get('x').identity.low});
        session.close();
    })
    .catch(function(error) {
        res.status(500).json({status:"Cannot Update Task"});
        console.log(error);
    });
    
});


/**
 * Get all Task nodes
 */
router.get('/all', (req, res, next) => {
    var session = driver.session();
    var projects = [];
    session
    .run('MATCH (n:Task) RETURN n')
    .then(function(result) {
        result.records.forEach(function(record) {
            projects.push({
                taskname:record.get('n').properties.taskname, 
                id:record.get('n').identity.low,
                personincharge:record.get('n').properties.personincharge,
                packagemanager:record.get('n').properties.packagemanager,
                startdate:record.get('n').properties.startdate,
                duration:record.get('n').properties.duration,
                enddate:record.get('n').properties.enddate,
                taskresources:record.get('n').properties.taskresources,
                taskprogress:record.get('n').properties.taskprogress
            });
        });
        res.status(200).json(projects);
        session.close();
    })
    .catch(function(error) {
        res.status(500).json({status:"Cannot get all tasks"});
        console.log(error);
    });
});

/**
 * Get Task node via ID
 */
router.get('/:id', (req, res, next) => {
    var session = driver.session();
    var request = {
        id: Number(req.params.id)
    }
    session
    .run('MATCH (p:Task) WHERE ID(p) = $id UNWIND p as x RETURN x', request)
    .then(function(result) {
        res.status(200).json({
            taskname:result.records[0].get('x').properties.taskname, 
            id:result.records[0].get('x').identity.low,
            personincharge:result.records[0].get('x').properties.personincharge,
            packagemanager:result.records[0].get('x').properties.packagemanager,
            startdate:result.records[0].get('x').properties.startdate,
            duration:result.records[0].get('x').properties.duration,
            enddate:result.records[0].get('x').properties.enddate,
            taskresources:result.records[0].get('x').properties.taskresources,
            taskprogress:result.records[0].get('x').properties.taskprogress
        });
        session.close();
    })
    .catch(function(error) {
        res.status(404).json({status:"id not found"});
        console.log(error);
    });
});


/**
 * Delete Task via node ID
 */
router.delete('/:id', (req, res, next) => {
    var session = driver.session();
    var request = {
        id: Number(req.params.id)
    }
    session
    .run('MATCH (n:Task) WHERE ID(n) = $id DETACH DELETE n', request)
    .then(function() {
        res.status(200).json("Deleted Project");
        session.close;
    })
    .catch(function(error) {
        console.log(error);
    });
});

module.exports = router;