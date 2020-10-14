const express = require('express');
const { create } = require('domain');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
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
            bcrypt.hash(req.body.password, 10, (err, hash) => {
                request.password = hash
                session1
                .run('CREATE (u:User {username:$username, email:$email, password:$password})', request)
                .then(function(result1) {
                    const token = jwt.sign(
                        {
                            email: req.body.email,
                            username: req.body.firstname
                        },
                        process.env.JWT_KEY, 
                        {
                            expiresIn: "2h"
                        }
                    );
                    res.status(200).json({"message":"created user","token":token});
                })
                .catch(function(error1) {
                    res.status(400).json("Couldn't create User");
                    session1.close
                    console.log(error1);
                });
            });
        } else {
            res.status(400).json("User already There");
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
    u_password = ""
    var request = {
        email:req.body.email,
        password:req.body.password
    }
    session
    .run('MATCH (u:User) WHERE u.email = $email RETURN u', request)
    .then(function(result) {
        if (result.records.length == 1) {
            var hashed = result.records[0].get("u").properties.password
            var uname = result.records[0].get("u").properties.username
            bcrypt.compare(req.body.password, hashed, (err, resul) => {
                if (!resul) {
                    res.status(401).json({message: "authentication Failed"});
                    session.close;
                } else if (resul) {
                    const token = jwt.sign(
                        {
                            email: req.body.email,
                            username: uname,
                        },
                        process.env.JWT_KEY,
                        {
                            expiresIn: "2h"
                        }
                    );
                    return res.status(200).json({
                        message: "authentication successful",
                        token: token
                    });
                    session.close;
                } else {
                    return res.status(401).json({message: "authentication Failed"});
                    session.close;
                }
            });
        } else {
            res.status(401).json({message: "authentication Failed"});
            session.close;
        }
    })
    .catch(function(error) {
        res.status(400).json("");//TODO:
        session.close
        console.log(error);
    });
});


module.exports = router;