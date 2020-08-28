
var neo4j = require('neo4j-driver');

var driver = neo4j.driver(
  'bolt://robabrams.homeip.net:7687',
   neo4j.auth.basic('neo4j', 'SuPr3m3L3d3r_TR0y')
)

module.exports = driver;