const express = require('express')
const Shop = require('../models/Shop')
const auth = require('../middleware/shop_auth')
const bcrypt = require('bcryptjs');

const router = express.Router()

router.post('/', async (req, res) => {
    // Create a new user
    try {
        const user = new Shop(req.body)
        await user.save()
        const token = await user.generateAuthToken()
        res.status(201).send({ user: user, token })
    } catch (error) {
        res.status(400).send(error)
    }
})

router.put('/', auth, async (req, res) => {
    // Create a new user
    try {
        //const user = new Shop(req.body)
        //await user.save()
        //const token = await user.generateAuthToken()

        const food = await Shop.findOneAndUpdate({_id : req.user._id}, {
            name : req.body.name,
            email : req.body.email
        }, {
            new: false
          });
        res.status(201).send({ status : 'success'})
    } catch (error) {
        res.status(400).send(error)
    }
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
            await Shop.findOneAndUpdate({_id : req.user._id}, {
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



router.post('/login', async(req, res) => {
	console.log("debug login");
    //Login a registered user
    try {
        const { email, password } = req.body
	console.log("email:", email)
	console.log("password:", password)
        const user = await Shop.findByCredentials(email, password)
        if (!user) {
            return res.status(401).send({error: 'Login failed! Check authentication credentials'})
        }
        const token = await user.generateAuthToken()
	   console.log(token);
	console.log("user");
	console.log(user);
        res.send({user: { type: 'shop', _id: user._id, name: user.name, email: user.email}, token })
    } catch (error) {
        res.status(400).send(error);
    }
})

router.get('/', auth, async(req, res) => {
    // View logged in user profile
    //delete req.user.password;
    req.user.password = ''
    res.send(req.user)
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
