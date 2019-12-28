const express = require('express')
const Order = require('../models/Order')
const Shop = require('../models/Shop')
const shop_auth = require('../middleware/shop_auth')
const stu_auth = require('../middleware/stu_auth')

module.exports = (io, socketIDs) => {


    const router = express.Router()

    router.post('/', stu_auth, async (req, res) => {
        // Create a new order
        console.log("debug");
        try {
            req.body.studentId = req.user._id;
            // check if shopId is valid

            let shop = await Shop.findOne({ _id: req.body.shopId });
            if (!shop) {
                res.status(400).send({ status: 'error', msg: 'Shop id is invalid' });
                return;
            }


            const item = new Order(req.body);
            item.save((err, doc) => {
                
                doc = JSON.parse(JSON.stringify(doc)) // some nasty tricks to allow attaching new items onto doc
                doc.student = req.user;

                console.log(doc);
                
                // notify shop
                if (socketIDs[item.shopId]) {
                    socketIDs[item.shopId].forEach(sid => {
                        io.to(sid).emit('new_order', doc);
                        console.log("emitted");
                    })
                }
                
                // notify client on other browsers
                
                if (socketIDs[req.user._id]) {
                    // add shop name
                    doc.shop = shop.name;
                    socketIDs[req.user._id].forEach(sid => {
                        io.to(sid).emit('new_order_self', doc);
                        console.log("emitted");
                    })
                }

                res.status(201).send({ status: 'success' })
            })
            //const token = await food.generateAuthToken()
        } catch (error) {
            console.log(error);
            res.status(400).send(error)
        }
    })

    router.get('/', stu_auth, (req, res) => {
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

            { $lookup: { from: 'shops', localField: 'shopId', foreignField: '_id', as: 'shop' } },
            { $match: { studentId: req.user._id } },
            /*{$sort : { createdAt : -1}}*/
            /*{$project : {"items":1,"price":1, "tags":1,"picture":1, "shop.name":1, "shopId":1}}*/
        ])

        orders.exec((err, result) => {


            result.map(r => {
                r.shop = r.shop[0].name;
                return r;
            })

            res.status(201).send(result);
        })


    })

    router.get('/shop', shop_auth, (req, res) => {


        let orders = Order.aggregate([

            { $lookup: { from: 'students', localField: 'studentId', foreignField: '_id', as: 'student' } },
            { $match: { shopId: req.user._id } },
            /*{$sort : { createdAt : -1}}*/
            /*{$project : {"items":1,"price":1, "tags":1,"picture":1, "shop.name":1, "shopId":1}}*/
        ])

        orders.exec((err, result) => {


            result.map(r => {
                r.student = r.student[0];
                return r;
            })

            res.status(201).send(result);
        })


    })

    router.put('/shop', shop_auth, async (req, res) => {

        let data = req.body;
        console.log(data);
        if (!data) {
            res.status(400).send({ status: "error", msg: "No query provided." })
            return;
        }

        if (!data.action) {
            res.status(400).send({ status: "error", msg: "No action provided." });
            return;
        }

        if (!data._id) {
            res.status(400).send({ status: "error", msg: "No id provided." });
            return;
        }

        let allowed_method = ["notify", "reject", "finish"];

        if (allowed_method.indexOf(data.action) === -1) {
            res.status(400).send({ status: "error", msg: "Action not supported." })
            return;
        }
        // get the order doc
        let ord;
        try {
            ord = await Order.findOne({ _id: data._id });
        } catch (e) {
            console.log(e);
            res.status(400).send({ status: "error", msg: "Order cannot be found." })
            return;
        }
        console.log("ord");
        console.log(ord);

        let updatedStatus = '';

        if (data.action === 'notify') {
            updatedStatus = 'notified';
        } else if (data.action === 'finish') {
            updatedStatus = 'finished';
        } else if (data.action === 'reject') {
            updatedStatus = 'rejected';
        }

        if (updatedStatus === ord.status) {
            res.status(400).send({ status: "error", msg: "Order status not changed." })
            return;
        } else {
            ord.status = updatedStatus;
        }

        console.log(ord);
        await ord.save();
        console.log("ord saved.");

        // notify students with the order
        if (socketIDs[ord.studentId]) {
            console.log("notifying student");
            
            socketIDs[ord.studentId].forEach(sid => {
                io.to(sid).emit('order_change', ord);
            })
        }
        
        if (socketIDs[ord.shopId]) {
            console.log("notifying shop");
            // notify shop opened with different browser
            socketIDs[ord.shopId].forEach(sid => {
                io.to(sid).emit('order_change_self', ord);
            })
        }

        res.status(201).send({ status: "success" });
    })
    return router;
}
