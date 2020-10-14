
var neo4j = require('neo4j-driver');
require('dotenv').config()

var driver = neo4j.driver(
  process.env.BOLT_URL,
   neo4j.auth.basic(process.env.BOLT_USER, process.env.BOLT_PASS)
)

module.exports = driver;