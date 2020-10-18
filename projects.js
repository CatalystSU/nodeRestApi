const express = require('express');
const { create } = require('domain');
const router = express.Router();

var driver = require('./neo4j');
const DirectedGraph = require('graphology');
const shortestPath = require('graphology-shortest-path/unweighted');
var {undirectedSingleSourceLength} = require('graphology-shortest-path/unweighted');
var {dijkstra} = require('graphology-shortest-path');
const { waitForDebugger } = require('inspector');
const { SSL_OP_EPHEMERAL_RSA } = require('constants');
const auth = require('./auth');

/**
 * Upload an entire project from json.
 */
router.post('/upload', auth, (req, res, next) => { //TODO: Add linking to user node
    var session = driver.session();
    var request = "";
    request += `CREATE (p:Project {name:"${req.body.project_name}"})`;
    for (let index = 0; index < req.body.tasks.length; index++) {
        const task = req.body.tasks[index];
        request += `CREATE (t${task.task_id}:Task {\
                    duration:"${task.duration}",\
                    taskprogress:${task.taskprogress},\
                    enddate:"${task.enddate}",\
                    packagemanager:"${task.packagemanager}",\
                    taskname:"${task.taskname}",\
                    taskresources:"${task.taskresources}",\
                    startdate:"${task.startdate}",\
                    personincharge:"${task.personincharge}"})`;
        request += `CREATE (t${task.task_id})-[:UNDER]->(p)`;
    };
    for (let index = 0; index < req.body.cons.length; index++) {
        const con = req.body.cons[index];
        request += `CREATE (t${con.from})-[:UNDER]->(t${con.to})`;
    };

    session
    .run(request)
    .then(function(result) {
        res.status(200).json("Project Uploaded");
    })
    .catch(function(error) {
        res.status(500).json({status:"Cannot create project"})
        console.log(error);
    });
});

/**
 * Create Project node, auto assigned ID
 */
router.post('/create',auth, (req, res, next) => {
    var session = driver.session();
    var request = {
        name: req.body.name,
        user_email: req.userData.email
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
 * Create Project node, auto assigned ID
 */
router.post('/create/dev',auth, (req, res, next) => {
    var session = driver.session();
    var request = {
        name: req.body.name,
        user_email: req.userData.email
    }
    session
    .run('MATCH (u:User) WHERE u.email = $user_email \
            CREATE (n:Project {name:$name}) \
            CREATE (u)-[:access_to]->(n) \
            return ID(n)', request)
    .then(function(result) {
        res.status(200).json({status:"Created Project", project_id:result.records[0]._fields[0].low});
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
router.post('/all', auth, (req, res, next) => {
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
router.post('/temp/:id', auth, (req, res, next) => {
    res.status(200).json(req.userData);
});


router.post('/devvy/:id', (req, res, next) => {
    var idd = req.params.id
    var viewData = {};
    var jsonData = {};
    var request = {
        id: Number(req.params.id)
    }

    getProject(idd)
    .then(function(result) {
        res.status(200).json(result);
    })
    .catch(function(error) {
        res.status(404).json({status:"id not found"})
        console.log(error);
    });

});

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
            console.log(data)
            resolve(data)
        })
        .catch(function(error) {
            reject(error)
            console.log(error);
        });
    });
}




router.post('/critical/:id', (req, res, next) => {
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
        // set the project name
        data.name = results[0].records[0].get('p').properties.name

        // get the tasks
        var length = results[1].records.length;
        let count = 0;
        results[1].records.forEach(function(record) {
            // I will assume even number of entries -> odd + odd = even and even + even = even
            var temp
            temp = record.get('n').properties
            temp.task_id = record.get('n').identity.low
            data.task_ob.tasks.push(temp);
            count++;
        });

        // get connections
        results[2].records.forEach(function(record) {
            temp = record._fields
            data.task_ob.cons.push({"from":temp[0].low,"to":temp[1].low})
        });

        jsonData["results"] = results;

        // bruh momento start the algo
        const graph = new DirectedGraph();
        var i;
        var nodes = [];
        // add nodes to graph
        for (i = 0; i < data.task_ob.tasks.length; i++) {
            graph.addNode(data.task_ob.tasks[i].task_id);
            var test = getDatum(data.task_ob.tasks[i].duration)
            nodes[data.task_ob.tasks[i].task_id] = test
        }

        var j;
        for (j = 0; j < data.task_ob.cons.length; j++) {
            e = graph.addEdge(data.task_ob.cons[j].from, data.task_ob.cons[j].to, {weight: nodes[data.task_ob.cons[j].to]}); //TODO: switch to and from TODO: TODO: TODO:
            //console.log(nodes[data.task_ob.cons[j].from])
        }

        best = []
        bestW = -Infinity;
        current = [];
        currentW = 0;
		graph.forEachNode(function(node) {
			if (graph.inNeighbors(node).length == 0) {
                current.push(parseInt(node));
                depthFirstSearch(node, graph);
                current.pop(node);
			}
		});
        res.status(200).json(best);
        session.close();
        session1.close();
        session2.close();
    })
    .catch(function(error) {
        res.status(404).json({status:"id not found"})
        console.log(error);
    });
});

var best = [];
var bestW = -Infinity;
var current = [];
var currentW = 0;

function depthFirstSearch(node, graph) {
	var isEnd = true;
	graph.outNeighbors(node).forEach(function(child) {
        var w = parseInt(graph.getEdgeAttribute(node, child, 'weight'));
        currentW += w;
		current.push(parseInt(child));
		depthFirstSearch(child, graph);
		current.pop(child);
		currentW -= w;
		isEnd = false;
	});
	if (isEnd && currentW > bestW) {
        bestW = currentW;
        best = [];
        for (let i = 0; i < current.length; i++) {
            best.push(parseInt(current[i]))
        }
	}
}

function getDatum(str) {
    /* Creating date based off of strings, date index by 0 */
    var datum = new Date(1970, 0, 1, 0, 0, 0, 0);
    var amount =  parseInt(str.split(" ")[0]);
    var ret
    var unit = str.split(" ")[1];
    if (unit == "Day" ||unit == "Days" ||unit == "days" || unit == "day(s)" ||unit == "Day(s)" ) {
        datum.setDate(amount)
        ret = amount
    } else if (unit == "weeks" || unit == "week(s)") {
        datum.setDate(amount*7)
        ret = amount*7
    } else if (unit == "months" ||unit == "month(s)") {
        datum.setMonth(amount)
        ret = amount*30
    } else {
        console.log("BRUH MOMENT - "+str);
    }

    return ret//datum.getTime();
}

/**
 * Get all tasks with given resource
 */
router.post('/resources', auth, (req, res, next) => {
    var tasks = []
    var session = driver.session();
    var request = {
        id: Number(req.body.project_id),
        resource: req.body.taskresource
    }
    session
    .run('  MATCH (p:Project) WHERE ID(p) = $id \
            MATCH (p)<-[:UNDER]-(n) \
            WHERE n.taskresources CONTAINS $resource \
            RETURN ID(n)', request)
    .then(function(result) {
        // get resources
        result.records.forEach(function(record) {
            tasks.push(record.get('ID(n)').low)
        });
        res.status(200).json(tasks);
        session.close();
    })
    .catch(function(error) {
        res.status(500).json({status:"Connot get tasks"})
        console.log(error);
    });
});

/**
 * Update Project node via ID
 */
router.post('/update/:id', auth, (req, res, next) => {
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
        session.close();
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
    .run('MATCH (n:Project) WHERE ID(n) = $id \
            MATCH (t:Task)-[:UNDER]->(n) \
            DETACH DELETE n, t', request)
    .then(function() {
        res.status(200).json({status: "Deleted Project"});
        session.close();
    })
    .catch(function(error) {
        res.status(400).json({status: "Unable to delete project", error: error});
        session.close();
        console.log(error);
    });
});

/**
 * Get Project Node via ID
 */
//const auth = require('check-auth');
router.post('/:id', auth, (req, res, next) => {
    var session = driver.session();
    var session1 = driver.session();
    var session2 = driver.session();
    var idd = req.params.id
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
        res.status(200).json(data);

        session.close();
        session1.close();
        session2.close();
    })
    .catch(function(error) {
        res.status(404).json({status:"id not found"})
        console.log(error);
    });
});


module.exports = router;
