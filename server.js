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

var express = require('express');
app = express();
cors = require('cors');
port = process.env.PORT || 3000;
app.use(cors());
app.listen(port);

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

console.log('todo list RESTful API server started on: ' + port);

const projects = require('./projects');
const tasks = require('./tasks');
const test = require('./test');
app.use('/project', projects);
app.use('/tasks', tasks);
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