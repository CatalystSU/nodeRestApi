const express = require('express');
const { create } = require('domain');
const router = express.Router();

var driver = require('./neo4j');

router.post('/create', (req, res, next) => {
    var session = driver.session();
    var request = {
        name: req.body.name,
        id: req.body.id
    }
    session
    .run('CREATE (n:Project {name:$name, id:$id})', request)
    .then(function(result) {
        res.status(200).json(result);
        result.records.forEach(function(record) {
            console.log(record.get('title'))
            console.log(record)
        });
        session.close();
    })
    .catch(function(error) {
        console.log(error);
    });
    
})
//MATCH (movie:Movie)
//RETURN movie.title
router.get('/get', (req, res, next) => {
    var session = driver.session();

    session
    .run('MATCH (n:Project) RETURN n')
    .then(function(result) {
        res.status(200).json(result);
        //console.log(result);
        //result.records.forEach(function(record) {
        //     console.log(record.get('name'))
            //console.log(record.get('id'))
        //});
        session.close();
    })
    .catch(function(error) {
        console.log(error);
    });
});

module.exports = router;