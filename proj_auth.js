var driver = require('./neo4j');

module.exports = (req, res, next) => {
    var session = driver.session();
    if (req.body.project_id != null) {
        request = {
            project_id: req.body.project_id,
            user_email: req.userData.email
        };
    } else {
        request = {
            project_id: Number(req.params.id),
            user_email: req.userData.email
        };
    }
    console.log(request);
    session
    .run('MATCH (p:Project) WHERE ID(p) = $project_id \
            MATCH (u:User) WHERE u.email = $user_email \
            MATCH (u)-[link:access_to]->(p) \
            return link', request)
    .then(function(result) {
        console.log(result);
        next();
    })
    .catch(function(error) {
        res.status(400).json({status: "Permission denied"})
        console.log(error);
    });
};