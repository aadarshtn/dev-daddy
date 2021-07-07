const jwt = require('jwtwebtoken');
const config = require('config');

module.export = function(req, res, next) {
    // Get the token from header
    const token = req.header('x-auth-token');

    // Check if no token coming inside header
    if(!token) {
        return res.status(401).json({ msg: 'No token! Authorization Denied' });
    }

    // Verify token
    try {
        const decoded = jwt.verify(token, config.get('jwtSecret'));
        req.user = decoded.user;
        next();
    } catch(err) {
        console.log(err.message);
        res.status(401).json({ msg: "Token is not valid" })
    }
}