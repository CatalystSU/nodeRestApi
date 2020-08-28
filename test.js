const express = require('express');
const router = express.Router();

router.get("/url", (req, res, next) => {
    res.json(["1","2","3","4","5"]);
});
  
router.get('/', (req, res) => {
    return res.send('Received a GET HTTP method');
});
  
router.post('/', (req, res) => {
    return res.send('Received a POST HTTP method');
});
  
router.put('/', (req, res) => {
    return res.send('Received a PUT HTTP method');
});
  
router.delete('/', (req, res) => {
    return res.send('Received a DELETE HTTP method');
});
  
router.post('/login', (req, res) => {
    res.status(200);
    return res.send('Logged in');
});


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
  
router.get('/dummy/project', (req, res) => {
    res.status(200);
    res.json(data);
});
  