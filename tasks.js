const express = require('express');
const { create } = require('domain');
const router = express.Router();

var driver = require('./neo4j');
const e = require('express');
const { start } = require('repl');

/**
 * Create Task node
 */
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
        CREATE (t)-[:UNDER]->(p)', request)
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
 * Verify all dates of connected nodes are correct. TODO:
 * @param {JSON} project 
 */
function verify(project) {
    cons = project.cons;
    tasks = project.tasks;
    var updated = true;
    while (updated) {
        updated = false;
        for (let i = 0; i < cons.length; i++) {
            const con = cons[i];
            var from = tasks[getTaskIndex(tasks, con.from)];
            var to = tasks[getTaskIndex(tasks, con.to)];
            if (from.enddate != getDate(from.startdate, from.duration)) {
                from.enddate = getDate(from.startdate, from.duration);
                updated = true;
            }
            if (to.startdate != from.enddate) {
                to.startdate = from.enddate;
                updated = true;
            }
            if (to.enddate != getDate(to.startdate, to.duration)) {
                to.enddate = getDate(to.startdate, to.duration);
                updated = true;
            }
        }
        console.log(project);
    }
    return project;
}

/**
 * Get the index of the task with given id.
 * @param {Array of tasks} tasks 
 * @param {Number} task_id 
 */
function getTaskIndex(tasks, task_id) {
    var i = 0;
    for (i = 0; i < tasks.length; i++) {
        const task = tasks[i];
        if (task.task_id == task_id) {
            break;
        }
    }
    return i;
}

/**
 * Get end date from given start date and duration.
 * @param {String} date 
 * @param {String} duration 
 */
function getDate(date, duration) {
    /* Splitting the date string */
    var sections = date.split("/");
    /* Creating date based off of strings, date index by 0 */
    var start = new Date(sections[2], sections[1]-1, sections[0], 0, 0, 0, 0);

    /* Find correct amount of days */
    var amount =  parseInt(duration.split(" ")[0]);
    var unit = duration.split(" ")[1];
    if (unit == "days") {
        console.log("Days");
        start.setDate(start.getDate() + amount);
    } else if (unit == "weeks") {
        console.log("Weeks");
        start.setDate(start.getDate() + (amount * 7));
    } else if (unit == "months") {
        console.log("Months");
        start.setMonth(start.getMonth() + amount);
    } else {
        console.log("findDate: Unit not recognised")
    }
    return "" + start.getDate() + "/" + (start.getMonth() + 1) + "/" + start.getFullYear();
}

/**
 * Create link between tasks
 */
router.post('/dev/link', (req, res, next) => {
    try {
        res.status(200).json(verify(req.body));
    } catch (error) {
        res.status(500).json(error);
    }
});

/**
 * Create link between tasks
 */
router.post('/link', (req, res, next) => {
    var session = driver.session();
    var request = {
        task_id1: req.body.task_id2,
        task_id2: req.body.task_id1
    };
    session
    .run('MATCH (t1:Task) WHERE ID(t1) = $task_id1\
        MATCH (t2:Task) WHERE ID(t2) = $task_id2\
        CREATE (t1)-[:UNDER]->(t2)', request)
    .then(function(result) {
        res.status(200).json({status:"Created Link", result:result});
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
router.post('/update', (req, res, next) => {
    var session = driver.session();
    var request = {
        id: req.body.task_id,
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
    .run('MATCH (p:Task) WHERE ID(p) = $id UNWIND p as x SET x = { \
                taskname:$taskname, \
                personincharge:$personincharge, \
                packagemanager:$packagemanager, \
                startdate: $startdate, \
                duration:$duration, \
                enddate:$enddate, \
                taskresources:$taskresources, \
                taskprogress:$taskprogress}', request)
    .then(function(result) {
        res.status(200).json({status:"Update Successful"});
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
        res.status(200).json("Deleted Task");
        session.close;
    })
    .catch(function(error) {
        console.log(error);
    });
});

module.exports = router;