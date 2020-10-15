const express = require('express');
const { create } = require('domain');
const router = express.Router();

router.get("/url", (req, res, next) => {
    res.json(["1","2","3","4","5"]);
});
  
router.get('/', (req, res, next) => {
    return res.send('Received a GET HTTP method');
});
  
router.post('/', (req, res, next) => {
    return res.send('Received a POST HTTP method');
});
  
router.put('/', (req, res, next) => {
    return res.send('Received a PUT HTTP method');
});
  
router.delete('/', (req, res, next) => {
    return res.send('Received a DELETE HTTP method');
});
  
router.post('/login', (req, res, next) => {
    res.status(200);
    return res.send('Logged in');
});


const data =
{
  name: "Task_1",
  children: [
    {
      name: "Task_1_a",
      children: [
        {
          name: "Task_1_b",
        },
        {
          name: "Task_1_c",
        },
        {
          name: "Task_1_d",
        }
      ]
    },
    {
      name: "Task_2",
    }
  ]
};
  
router.get('/dummy/project', (req, res, next) => {
    res.status(200);
    res.json(data);
});
  
module.exports = router;

function bellman(start, distance, pre, graph, nodes) {
  var max = 0
  var min = Infinity
  graph.forEachNode((node) => {
      //console.log(node)
      distance[node] = Infinity
      pre[node] = null
      if (parseInt(node) > max) {
          max = node
      }
      if (parseInt(node) < min) {
          min = node
      }
  });

  // look for source
  distance[parseInt(min)] = 0
  for (var i = parseInt(min); i < parseInt(max); i++) {
      if (distance[i] != null) {
          graph.forEachEdge((edge, attributes, source, target, sourceAttributes, targetAttributes) => {
              if (source == i) {
                  if (distance[parseInt(source,10)] + 1 < distance[parseInt(target,10)]) {
                      distance[parseInt(target,10)] = distance[parseInt(source,10)]+1
                      pre[parseInt(target,10)] = parseInt(source, 10);
                  }
                  //console.log(`Edge from ${source} to ${target}`);
              }
          });
      }
  }
  for (var i = parseInt(min); i <= parseInt(max); i++) {
      if (pre[i]!=null) {
          console.log("i")
          console.log(i)
          console.log("pre[i]")
          console.log(pre[i])
          //remove dups
          nodes.push(i)
          nodes.push(pre[i])
      }
  }
}

// GET THE SOURCE NODE
// var distance = [];
// var pre = [];
// //bellman(data.task_ob.tasks[0].task_id, distance, pre, graph, nodes)
// for (i = 0; i < data.task_ob.tasks.length; i++) {
//     const path = dijkstra.singleSource(graph, data.task_ob.tasks[i].task_id.toString());
//     nodes.push(path)
// }

// console.log('Number of nodes', graph.order);
// console.log('Number of edges', graph.size);
function getDatum(str) {
  var sections = date.split("/");
  /* Creating date based off of strings, date index by 0 */
  var datum = new Date(1970, 0, 1, 0, 0, 0, 0);

  var amount =  parseInt(str.split(" ")[0]);
  var unit = str.split(" ")[1];
  if (unit == "day(s)") {
      datum.setDate(amount)
  } else if (unit == "week(s)") {
      datum.setDate(amount*7)
  } else if (unit == "month(s)") {
      datum.setMonth(amount)
  } else {
      console.log("BRUH MOMENT");
  }

  return datum.getTime();
}

