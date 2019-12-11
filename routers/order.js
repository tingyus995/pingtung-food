const express = require('express')
const Order = require('../models/Order')
const shop_auth = require('../middleware/shop_auth')
const stu_auth = require('../middleware/stu_auth')

module.exports = (io, socketIDs) => {


    const router = express.Router()

    router.post('/', stu_auth, async (req, res) => {
        // Create a new order
        console.log("debug");
        try {
            req.body.studentId = req.user._id;
            const item = new Order(req.body);
            item.save((err,doc) =>{
                if(socketIDs[item.shopId]){

                    doc = JSON.parse(JSON.stringify(doc)) // some nasty tricks to allow attaching new items onto doc
                    doc.student = req.user;
                    
                    console.log(doc);
                    io.to(socketIDs[item.shopId]).emit('new_order', doc);
                    console.log("emitted");
                }
                res.status(201).send({ status : 'success' })
            })
            //const token = await food.generateAuthToken()
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
            {$match : { studentId : req.user._id}},
            /*{$sort : { createdAt : -1}}*/
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

    router.get('/shop',shop_auth, (req, res) => {


        let orders = Order.aggregate([
            
            {$lookup: { from: 'students', localField: 'studentId', foreignField: '_id', as: 'student' }},
            {$match : { shopId : req.user._id}},
            /*{$sort : { createdAt : -1}}*/
            /*{$project : {"items":1,"price":1, "tags":1,"picture":1, "shop.name":1, "shopId":1}}*/
            ])

            orders.exec((err, result) => {
                

            result.map(r =>{
                r.student = r.student[0];
                return r;
            })
            
            res.status(201).send(result);
        })


    })

    router.put('/shop',shop_auth, async (req, res) => {

        let data = req.body;
        console.log(data);
        if(!data){
            res.status(400).send({status : "error", msg : "No query provided."})
            return;
        } 

        if(!data.action) {
            res.status(400).send({status : "error", msg : "No action provided."});
            return;
        }

        if(!data._id){
            res.status(400).send({status : "error", msg : "No id provided."});
            return;
        }

        let allowed_method = ["notify", "reject", "finish"];

        if(allowed_method.indexOf(data.action) === -1) {
            res.status(400).send({status : "error", msg : "Action not supported."})
            return;
        }
        // get the order doc
        let ord;
        try{
            ord = await Order.findOne({_id : data._id});
        }catch(e){
            console.log(e);
            res.status(400).send({status : "error", msg : "Order cannot be found."})
            return;
        }
        console.log("ord");
        console.log(ord);
        
        let updatedStatus = '';

        if(data.action === 'notify'){
            updatedStatus = 'notified';
        }else if (data.action === 'finish'){
            updatedStatus = 'finished';        
        } else if(data.action === 'reject'){
            updatedStatus = 'rejected';
        }

        if(updatedStatus === ord.status){
            res.status(400).send({status : "error", msg : "Order status not changed."})
            return;
        }else{
            ord.status = updatedStatus;
        }

        console.log(ord);
        await ord.save();
        console.log("ord saved.");

        if(socketIDs[ord.studentId]){
            console.log("notifying student");
            io.to(socketIDs[ord.studentId]).emit('order_change', ord);
        }
        
        res.status(201).send({status : "success"});
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

    return router;

}
