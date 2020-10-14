const express = require('express');
const { create } = require('domain');
const router = express.Router();

var driver = require('./neo4j');
const { waitForDebugger } = require('inspector');
const { SSL_OP_EPHEMERAL_RSA } = require('constants');


/**
 * Create User
 */
router.post('/create', (req, res, next) => {
    var session = driver.session();
    var session1 = driver.session();
    var request = {
        username:req.body.username,
        email:req.body.email,
        password:req.body.password
    }
    console.log(request)
    session
    .run('MATCH (u:User) WHERE u.email = $email RETURN u', request)
    .then(function(result) {
        if (result.records.length < 1) {
            session1
            .run('CREATE (u:User {username:$username, email:$email, password:$password})', request)
            .then(function(result1) {
                res.status(200).json("Created User");
            })
            .catch(function(error1) {
                res.status(400).json("Couldn't create User");
                session1.close
                console.log(error1);
            });
        } else {
            res.status(200).json("User already There");
            session.close;
        }
    })
    .catch(function(error) {
        res.status(400).json(error);//TODO:
        session.close
        console.log(error);
    });
});

/**
 * User Auth
 */
router.post('/auth', (req, res, next) => {
    var session = driver.session();
    var request = {
        //TODO:
    }
    session
    .run('', request)
    .then(function() {
        res.status(200).json("Authed User");
        session.close;
    })
    .catch(function(error) {
        res.status(400).json("");//TODO:
        session.close
        console.log(error);
    });
});


module.exports = router;