const express = require('express')
const Student = require('../models/Student')
const auth = require('../middleware/stu_auth')
const bcrypt = require('bcryptjs');
const email = require('../email')();
const router = express.Router()



let vertificationCodes = {};

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}


router.post('/code', async (req, res) => {
    let data = req.body;
    
    
    let re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@/;
    if (!data) {
        res.status(400).send({ status: "error", msg: "No email provided." })
        return;
    }

    if(!data.email){
        res.status(400).send({ status: "error", msg: "No email provided." })
        return;
    }

    if(!data.email.endsWith('@' + process.env.ALLOWED_DOMAIN)){
        res.status(400).send({ status: "error", msg: "E-mail domain not allowed." })
        return;
    }
    if(!re.test(data.email)){
        res.status(400).send({ status: "error", msg: "E-mail format invalid." })
        return;
    }

    let code = getRandomInt(10000,99999);
    console.log("Code:" + code);

    vertificationCodes[data.email] = code;

    setTimeout(function(){
        console.log("Deleting vertification code:");
        console.log(data.email);
        console.log(vertificationCodes[data.email]);
        delete vertificationCodes[data.email];
    }, 120 * 1000)

    console.log("sending email...");
    console.log(email);
    email.send(data.email,"探索屏東美食註冊驗證碼","感謝您加入探索屏東美食的成員，以下是您的驗證碼：" + code);
    res.send({status : 'ok'});    
})

router.post('/vertification', async (req, res) => {
    let data = req.body;
    let re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@/;
    if (!data) {
        res.status(400).send({ status: "error", msg: "No information provided." })
        return;
    }
    if(!data.email){
        res.status(400).send({ status: "error", msg: "No email provided." })
        return;
    }
    if(!data.email.endsWith('@' + process.env.ALLOWED_DOMAIN)){
        res.status(400).send({ status: "error", msg: "E-mail domain not allowed." })
        return;
    }
    if(!re.test(data.email)){
        res.status(400).send({ status: "error", msg: "E-mail format invalid." })
        return;
    }
    if(!data.code){
        res.status(400).send({ status: "error", msg: "No code provided." })
        return;
    }

    if(vertificationCodes[data.email] === parseInt(data.code)){
        res.send({status : 'ok'});
    }else{
        res.status(400).send({status : 'error', msg : "Vertification code incorrect"});
    }

})


router.post('/', async (req, res) => {
    // Create a new user
    try {
        const user = new Student(req.body)
        await user.save()
        const token = await user.generateAuthToken()
        //res.status(201).send({ user: user, token })
        res.send({user: { type: 'student', _id: user._id, name: user.name, email: user.email}, token })
    } catch (error) {
        res.status(400).send(error)
    }
})

router.post('/login', async(req, res) => {
	console.log("debug login");
    //Login a registered user
    try {
        const { email, password } = req.body
	console.log("email:", email)
	console.log("password:", password)
        const user = await Student.findByCredentials(email, password)
        if (!user) {
            return res.status(401).send({error: 'Login failed! Check authentication credentials'})
        }
        const token = await user.generateAuthToken()
	   console.log(token);
	console.log("user");
	console.log(user);
        res.send({user: { type: 'student', _id: user._id, name: user.name, email: user.email}, token })
    } catch (error) {
        res.status(400).send(error);
    }
})

router.get('/', auth, async(req, res) => {
    // View logged in user profile
    req.user.password = ''
    res.send(req.user)
})

router.put('/changepasswd', auth, async (req, res) => {
    // Create a new user
    try {
        //const user = new Shop(req.body)
        //await user.save()
        //const token = await user.generateAuthToken()
        
        const matched =  await bcrypt.compare(req.body.original_password, req.user.password);
        
        if(matched){
            console.log("password matched.");
            console.log(req.body.password);
            await Student.findOneAndUpdate({_id : req.user._id}, {
                password : await bcrypt.hash(req.body.password, 8)
            }, {
                new: false
              });
            console.log("updated");
            res.status(201).send({ status : 'success'})
        }else{
            throw { message : "original password incorrect."}
        }

    } catch (error) {
        console.log(error);
        res.status(400).send(error)
    }
})


/*router.post('/users/me/logout', auth, async (req, res) => {
    // Log user out of the application
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token != req.token
        })
        await req.user.save()
        res.send()
    } catch (error) {
        res.status(500).send(error)
    }
})*/

/*router.post('/users/me/logoutall', auth, async(req, res) => {
    // Log user out of all devices
    try {
        req.user.tokens.splice(0, req.user.tokens.length)
        await req.user.save()
        res.send()
    } catch (error) {
        res.status(500).send(error)
    }
})*/

module.exports = router
