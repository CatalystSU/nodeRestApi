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
    var request = {
        //TODO:
    }
    session
    .run('', request)
    .then(function() {
        res.status(200).json("Created User");
        session.close;
    })
    .catch(function(error) {
        res.status(400).json("");//TODO:
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