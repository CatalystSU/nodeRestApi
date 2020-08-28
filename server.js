// Starter app
/*const http = require('http');

const hostname = '127.0.0.1';
const port = 3000;

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Hello World');
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
*/

var neo4j = require('neo4j-driver');

var driver = neo4j.driver(
  'bolt://robabrams.homeip.net:7687',
   neo4j.auth.basic('neo4j', 'SuPr3m3L3d3r_TR0y')
)

var session = driver.session();
session
.run("MATCH (:Person {name: 'Tom Hanks'})-[:ACTED_IN]->(movies) RETURN movies.title AS title")
.then(function(result) {
    result.records.forEach(function(record) {
        console.log(record.get('title'))
        console.log(record)
    });
    session.close();
})
.catch(function(error) {
    console.log(error);
});

var express = require('express');
app = express();
cors = require('cors');
port = process.env.PORT || 3000;
app.use(cors());
app.listen(port);

console.log('todo list RESTful API server started on: ' + port);

const projects = require('./projects');
const test = require('./test');
app.use('/project', projects);
app.use('/', test);


app.use((req, res, next) => {
  const error = new Error('Not Found');
  res.status(404);
  next(error)
});

app.use((error, req, res, next) => {
  res.status(error.status || 500);
  res.json({
      error: {
          message: error.message
      }
  })
  next(error)
});

