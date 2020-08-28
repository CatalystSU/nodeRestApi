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

const data =
{
  name: "Task1",
  children: [
    {
      name: "Task1a",
      children: [
        {
          name: "Task1b",
        },
        {
          name: "Task1c",
        },
        {
          name: "Task1d",
        }
      ]
    },
    {
      name: "Task2",
    }
  ]
};

var express = require('express');
app = express();
cors = require('cors');
port = process.env.PORT || 3000;
app.use(cors());
app.listen(port);

console.log('todo list RESTful API server started on: ' + port);

app.get("/url", (req, res, next) => {
  res.json(["1","2","3","4","5"]);
 });

app.get('/', (req, res) => {
  return res.send('Received a GET HTTP method');
});

app.post('/', (req, res) => {
  return res.send('Received a POST HTTP method');
});

app.put('/', (req, res) => {
  return res.send('Received a PUT HTTP method');
});

app.delete('/', (req, res) => {
  return res.send('Received a DELETE HTTP method');
});

app.post('/login', (req, res) => {
  res.status(200);
  return res.send('Logged in');
});

app.get('/dummy/project', (req, res) => {
  res.status(200);
  res.json(data);
});
