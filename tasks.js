const express = require('express');
const { create } = require('domain');
const router = express.Router();

var driver = require('./neo4j');
const e = require('express');
const { start } = require('repl');
const { appendFileSync } = require('fs');
const auth = require('./auth');

/**
 * Create Task node
 */
router.post('/create', auth, (req, res, next) => {
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
        CREATE (t)-[:UNDER]->(p)\
        RETURN ID(t)', request)
    .then(function(result) {
        if (result.records.length < 1) {
            res.status(400).json({status:"Couldn't create task"});
            session.close();
        } else {
            res.status(200).json({status:"Created Task", task_id:result.records[0]._fields[0].low});
            session.close();
        }
        
    })
    .catch(function(error) {
        res.status(500).json({status:"Cannot create task"});
        console.log(error);
    });
});

/**
 * Return true if start > end false otherwise
 * @param {String} start 
 * @param {String} end 
 */
function greater_than(start, end) {
    /* Splitting the date string */
    var sections = start.split("-");
    
    
    var start_year = parseInt(sections[0]);
    var start_month = parseInt(sections[1]);
    var start_day = parseInt(sections[2]);
    // console.log(start_year + " " + start_month + " " + start_day);
    sections = end.split("-");
    var end_year = parseInt(sections[0]);
    var end_month = parseInt(sections[1]);
    var end_day = parseInt(sections[2]);
    // console.log(end_year + " " + end_month + " " + end_day);

    if (start_year > end_year) {
        return true;
    } else if (start_year < end_year){
        return false;
    } else {
        if (start_month > end_month) {
            return true;
        } else if (start_month < end_month){
            return false;
        } else {
            if (start_day > end_day) {
                return true;
            } else if (start_day < end_day){
                return false;
            } else {
                return false;
            }
        }
    }


}

/**
 * Verify all dates of connected nodes are correct.
 * @param {JSON} project 
 */
function verify(project) {
    cons = project.task_ob.cons;
    tasks = project.task_ob.tasks;
    var updated = true;
    while (updated) {
        updated = false;
        for (let i = 0; i < cons.length; i++) {
            const con = cons[i];
            var from_index = getTaskIndex(tasks, con.from);
            var to_index = getTaskIndex(tasks, con.to);
            var from = tasks[from_index];
            var to = tasks[to_index];
            /* from end date = start + duration */
            if (from.enddate != getDate(from.startdate, from.duration)) {
                from.enddate = getDate(from.startdate, from.duration);
                updated = true;
            }
            /* to start = from end */
            if (greater_than(from.enddate, to.startdate)) {
                to.startdate = from.enddate;
                updated = true;
            }
            /* to end = start + duration */
            if (to.enddate != getDate(to.startdate, to.duration)) {
                to.enddate = getDate(to.startdate, to.duration);
                updated = true;
            }
        }
        //console.log(project);
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
    var sections = date.split("-");
    /* Creating date based off of strings, date index by 0 */
    console.log("sections = " + sections);
    var start = new Date(parseInt(sections[0]), parseInt(sections[1])-1, parseInt(sections[2]), 0, 0, 0, 0);
    console.log("Date = " + start);
    console.log("Duration = " + duration);

    /* Find correct amount of days */
    var amount =  parseInt(duration.split(" ")[0]);
    var unit = duration.split(" ")[1];
    if (unit == "day(s)") {
        console.log("Days");
        start.setDate(start.getDate() + amount);
    } else if (unit == "week(s)") {
        console.log("Weeks");
        start.setDate(start.getDate() + (amount * 7));
    } else if (unit == "month(s)") {
        console.log("Months");
        start.setMonth(start.getMonth() + amount);
    } else {
        console.log("findDate: Unit not recognised")
    }
    var ret = "" + start.getFullYear();
    if (start.getMonth() < 9) {
        ret += "-0" + (start.getMonth()+1); 
    } else {
        ret += "-" + (start.getMonth()+1);
    }
    if (start.getDate() < 10) {
        ret += "-0" + start.getDate(); 
    } else {
        ret += "-" + start.getDate();
    }
    console.log("Ret = " + ret);
    return ret;
}

/**
 * Create link between tasks
 */
router.post('/link', auth, (req, res, next) => {
    var session = driver.session();
    var request = {
        task_id1: req.body.task_id2,
        task_id2: req.body.task_id1,
        project_id: req.body.project_id
    };
    session
    .run('MATCH (t1:Task) WHERE ID(t1) = $task_id1\
        MATCH (t2:Task) WHERE ID(t2) = $task_id2\
        CREATE (t1)-[:UNDER]->(t2)', request)
    .then(function(result) {
        getProject(request.project_id)
        .then(function(result) {
            console.log({poes:result});
            verify(result);
            update_all(result)
            .then(function(result) {
                res.status(200).json({status:"Created Link"});
                session.close();
            })
            .catch(function(error) {
                res.status(500).json({status:"Couldn't update Tasks"});
                console.log(error);
                session.close();
            });
        })
        .catch(function(error) {
            res.status(500).json({status:"Couldnt Get project"});
            console.log(error);
            session.close();
        });
        
    })
    .catch(function(error) {
        res.status(500).json({status:"Cannot create Link"});
        console.log(error);
        session.close();
    });
});

/**
 * Create link between tasks
 */
//TODO: old route get rid of if new route works
router.post('/dev/link', auth, (req, res, next) => {
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
router.post('/update', auth, (req, res, next) => {
    var session = driver.session();
    var request = {
        id: req.body.task_id,
        //project_id: req.body.project_id,
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
        getProject(request.project_id)
        .then(function(result) {
            console.log({poes:result});
            verify(result);
            update_all(result)
            .then(function(result) {
                res.status(200).json({status:"Updated"});
                session.close();
            })
            .catch(function(error) {
                res.status(500).json({status:"Couldn't update Tasks"});
                console.log(error);
                session.close();
            });
        })
        .catch(function(error) {
            res.status(500).json({status:"Couldnt Get project"});
            console.log(error);
            session.close();
        });
        
    })
    .catch(function(error) {
        res.status(500).json({status:"Cannot update task"});
        console.log(error);
        session.close();
    });
    
});


/**
 * Get all Task nodes
 */
router.post('/all', auth, (req, res, next) => {
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
router.post('/:id', auth, (req, res, next) => {
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
 * Create request string to update all tasks.
 * @param {JSON} project 
 */
function update_all(project) {
    return new Promise(function(resolve, reject) {
        tasks = project.task_ob.tasks;
        var session = driver.session();
        var request = "";
        for (let index = 0; index < tasks.length; index++) {
            const task = tasks[index];
            request += `MATCH (p:Task) WHERE ID(p) = ${task.task_id} UNWIND p as x SET x = {\
                        duration:"${task.duration}",\
                        taskprogress:${task.taskprogress},\
                        enddate:"${task.enddate}",\
                        packagemanager:"${task.packagemanager}",\
                        taskname:"${task.taskname}",\
                        taskresources:"${task.taskresources}",\
                        startdate:"${task.startdate}",\
                        personincharge:"${task.personincharge}"} \
                        WITH count(*) as dummy `;
        };
        request += ' RETURN dummy '
        session
        .run(request)
        .then(function(result) {
            resolve(result);
        })
        .catch(function(error) {
            reject(error);
        });
    });
}


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

/**
 * Returns full project JSON
 * @param {Number} id 
 */
function getProject(id) {
    return new Promise(function(resolve, reject) {
        var session = driver.session();
        var session1 = driver.session();
        var session2 = driver.session();
        var data = {
            id: Number(id),
            task_ob: {
                tasks: [],
                cons: []
            }

        };
        var viewData = {};
        var jsonData = {};
        var request = {
            id: Number(id)
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
            // set the project name
            data.name = results[0].records[0].get('p').properties.name

            // get the tasks
            var length = results[1].records.length;
            let count = 0;
            results[1].records.forEach(function(record) {
                // I will assume even number of entries -> odd + odd = even and even + even = even
                var temp
                temp = record.get('n').properties
                if (record.get('n').properties.taskprogress.low != null) {
                    temp.taskprogress = record.get('n').properties.taskprogress.low
                }

                temp.task_id = record.get('n').identity.low
                data.task_ob.tasks.push(temp);
                count++;
            });

            // get connections
            results[2].records.forEach(function(record) {
                temp = record._fields
                data.task_ob.cons.push({"from":temp[1].low,"to":temp[0].low})
            });

            jsonData["results"] = results;
            session.close();
            session1.close();
            session2.close();
            //console.log(data);
            resolve(data);
        })
        .catch(function(error) {
            reject(error)
            console.log(error); 
        });
    });
}

module.exports = router;