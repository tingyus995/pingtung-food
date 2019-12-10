const express = require('express')
const Order = require('../models/Order')
const shop_auth = require('../middleware/shop_auth')
const stu_auth = require('../middleware/stu_auth')

const router = express.Router()

router.post('/', stu_auth, async (req, res) => {
    // Create a new order
    console.log("debug");
    try {
        req.body.studentId = req.user._id;
        const item = new Order(req.body);
        await item.save()
        //const token = await food.generateAuthToken()
        res.status(201).send({ status : 'success' })
    } catch (error) {
        console.log(error);
        res.status(400).send(error)
    }
})

router.get('/',stu_auth, (req, res) => {
    /*Food.find({
        $lookup:
     {
       from: "Shop",
       localField:"shopId",
       foreignField: "name",
       as: "shop"
     }
    },(err,r) => {
        res.status(201).send(r);
    })*/

    let orders = Order.aggregate([
        
        {$lookup: { from: 'shops', localField: 'shopId', foreignField: '_id', as: 'shop' }},
        {$match : { studentId : req.user._id}}
        /*{$project : {"items":1,"price":1, "tags":1,"picture":1, "shop.name":1, "shopId":1}}*/
        ])

        orders.exec((err, result) => {
               

        result.map(r =>{
            r.shop = r.shop[0].name;
            return r;
        })
        
        res.status(201).send(result);
    })


})

/*router.post('/login', async(req, res) => {
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
})*/

/*router.get('/', auth, async(req, res) => {
    // View logged in user profile
    res.send(req.user)
})*/

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
