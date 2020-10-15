const express = require('express');
const { create } = require('domain');
const router = express.Router();

var driver = require('./neo4j');
const Graph = require('graphology');
const shortestPath = require('graphology-shortest-path/unweighted');
var {undirectedSingleSourceLength} = require('graphology-shortest-path/unweighted');
var {dijkstra} = require('graphology-shortest-path');
const { waitForDebugger } = require('inspector');
const { SSL_OP_EPHEMERAL_RSA } = require('constants');

router.post('/upload', (req, res, next) => {
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
            if (record.get('n').properties.taskprogress.low != null) {
                temp.taskprogress = record.get('n').properties.taskprogress.low
            }
            console.log(record.get('n').properties)
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

router.get('/critical/:id', (req, res, next) => {
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
        const graph = new Graph();
        var i;
        var nodes = [];
        // add nodes to graph
        for (i = 0; i < data.task_ob.tasks.length; i++) {
            graph.addNode(data.task_ob.tasks[i].task_id);
            nodes.push(data.task_ob.tasks[i].task_id)
        }

        var j;
        // add connections to graph
        for (j = 0; j < data.task_ob.cons.length; j++) {
            graph.addEdge(data.task_ob.cons[j].from, data.task_ob.cons[j].to);
        }

        // Returning every shortest path between source & every node of the graph
        //const paths = undirectedSingleSourceLength(graph, data.task_ob.tasks[0].task_id);
        //const paths = dijkstra.singleSource(graph, data.task_ob.tasks[0].task_id);
        //const path = dijkstra.bidirectional(graph, data.task_ob.tasks[0].task_id, data.task_ob.tasks[data.task_ob.tasks.length-1].task_id);
        //const path = shortestPath(graph, data.task_ob.tasks[0].task_id, data.task_ob.tasks[data.task_ob.tasks.length-1].task_id);
        //console.log(paths)
        //console.log('Number of nodes', graph.order);
        //console.log('Number of edges', graph.size);
        //console.log(path)'

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

function djikstraAlgorithm(startNode) {
    let distances = {};
    // Stores the reference to previous nodes
    let prev = {};
    let pq = new PriorityQueue(this.nodes.length * this.nodes.length);
    // Set distances to all nodes to be infinite except startNode
    distances[startNode] = 0;
    pq.enqueue(startNode, 0);
    this.nodes.forEach(node => {
       if (node !== startNode) distances[node] = Infinity;
       prev[node] = null;
    });

    while (!pq.isEmpty()) {
       let minNode = pq.dequeue();
       let currNode = minNode.data;
       let weight = minNode.priority;
       this.edges[currNode].forEach(neighbor => {
          let alt = distances[currNode] + neighbor.weight;
          if (alt < distances[neighbor.node]) {
             distances[neighbor.node] = alt;
             prev[neighbor.node] = currNode;
             pq.enqueue(neighbor.node, distances[neighbor.node]);
          }
       });
    }
    return distances;
}

/**
 * Get all tasks with given resource
 */
router.post('/resources', (req, res, next) => {
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