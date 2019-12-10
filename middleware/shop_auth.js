const jwt = require('jsonwebtoken')
const User = require('../models/Shop')

const auth = async (req, res, next) => {
    let token;
    try {
        token = req.header('Authorization').replace('bearer ', '')
        console.log(token);
    } catch (e) {
            res.status(401).send({error : "Invalid JWT token."});
    }
   
    const data = jwt.verify(token, process.env.JWT_KEY)
    try {
        const user = await User.findOne({ _id: data._id })
        if (!user) {
            throw new Error()
        }
        req.user = user
        req.token = token
        next()
    } catch (error) {
        res.status(401).send({ error: 'Not authorized to access this resource' })
    }

}
module.exports = auth
