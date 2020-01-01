const express = require('express')
const stream = require('stream')
const Food = require('../models/Food')
const Shop = require('../models/Shop')
const shop_auth = require('../middleware/shop_auth')
const student_auth = require('../middleware/stu_auth')
module.exports = (io, socketIDs) => {
    const router = express.Router()

    router.put('/', shop_auth, async (req, res) => {
        // Modify a food
        console.log("debug");
        try {
            req.body.shopId = req.user._id;

            const food = await Food.findOneAndUpdate({ _id: req.body._id, shopId: req.user._id }, req.body, {
                new: true
            });
            let new_food = JSON.parse(JSON.stringify(food));
            console.log(new_food);
            //new_food._id = req.body._id;
            new_food.shop = {
                name : req.user.name,
                _id : req.user._id,
                status : req.user.status
            }
            io.emit('food_change', new_food);
            console.log('notified food change');

            res.status(201).send({ status: 'success' })
        } catch (error) {
            console.log(error);
            res.status(400).send(error)
        }
    })
    router.delete('/', shop_auth, async (req, res) => {
        // Delete food
        console.log("debug");
        try {
            //req.body.shopId = req.user._id;

            console.log(req.body._id);

            Food.findOneAndRemove({ _id: req.body._id, shopId: req.user._id })
                .exec((err, result) => {
                    if (err) console.log(err);
                    console.log(result);
                    io.emit('delete_food', result);
                    res.status(201).send({ status: 'success' })
                });
            //const token = await food.generateAuthToken()
        } catch (error) {
            console.log(error);
            res.status(400).send(error)
        }
    })

    router.post('/', shop_auth, async (req, res) => {
        // Create a new food
        console.log("debug");
        try {
            req.body.shopId = req.user._id;
            let food = new Food(req.body);
            await food.save()
            food = JSON.parse(JSON.stringify(food));
            food.shop = {
                name : req.user.name,
                _id : req.user._id,
                status : req.user.status
            }
            io.emit('new_food', food);
            //const token = await food.generateAuthToken()
            res.status(201).send({ status: 'success' })
        } catch (error) {
            console.log(error);
            res.status(400).send(error)
        }
    })


    router.get('/img/:foodId', async (req, res) => {
        console.log(req.params.foodId);
        try{
            const food = await Food.findOne({_id : req.params.foodId});
            //console.log(food.picture);
            let base64 = food.picture;
            let re = /data:(image\/\w+);/;
            let contentType = base64.match(re)[1];
            //console.log(contentType);
            var base64Data = base64.replace(/data:image\/\w+;base64,/, '');
            var img = Buffer.from(base64Data, 'base64');
            //console.log(base64Data);
            res.writeHead(200, {
              'Content-Type': contentType,
              'Content-Length': img.length
            });
            res.end(img);
            //res.status(201).send('ok');


        }catch(e){
            res.status(400).send(e);
            console.log(e);
        }
    })



    router.get('/', (req, res) => {
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

        let foods = Food.aggregate([

            { $lookup: { from: 'shops', localField: 'shopId', foreignField: '_id', as: 'shop' } },
            /*{ $project: {"likes" : 1, "name": 1, "price": 1, "tags": 1, "picture": 1, "shop.name": 1, "shopId": 1 } }*/
        ])

        foods.exec((err, result) => {


            result.map(r => {
                r.shop = r.shop[0];
                r.picture = process.env.APP_ROOT + "/food/img/" + r._id;
                return r;
            })



            res.status(201).send(result);
        })


    })

    router.get('/shop', shop_auth, (req, res) => {
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

        let foods = Food.aggregate([

            { $lookup: { from: 'shops', localField: 'shopId', foreignField: '_id', as: 'shop' } },
            { $match: { shopId: req.user._id } },
            /*{ $project: { "name": 1, "price": 1, "tags": 1, "picture": 1, "shop.name": 1, "shopId": 1 } }*/
        ])

        foods.exec((err, result) => {


            result.map(r => {
                r.shop = r.shop[0];
                r.picture = process.env.APP_ROOT + "/food/img/" + r._id;
                return r;
            })



            res.status(201).send(result);
        })
    })

    router.put('/favorite', student_auth, async (req, res) => {

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

        let allowed_method = ["like", "unlike"];

        if (allowed_method.indexOf(data.action) === -1) {
            res.status(400).send({ status: "error", msg: "Action not supported." })
            return;
        }
        // get the order doc
        let food;
        try {
            food = await Food.findOne({ _id: data._id });
        } catch (e) {
            console.log(e);
            res.status(400).send({ status: "error", msg: "Order cannot be found." })
            return;
        }
        console.log("food");
        console.log(food);

        let liked;

        if (food.likes.indexOf(req.user._id) === -1) {
            liked = false;
        } else {
            liked = true;
        }

        if ((data.action === 'like' && liked === true) || (data.action === 'unlike' && liked === false)) {
            res.status(400).send({ status: "error", msg: "Like status not changed." })
            return;
        } else {
            if (data.action === 'like') {
                food.likes.push(req.user._id);
            } else {
                food.likes.splice(food.likes.indexOf(req.user._id), 1);
            }
        }

        console.log(food);
        await food.save();
        console.log("food saved.");
        let shop = await Shop.findOne({_id : food.shopId});
        let new_food = JSON.parse(JSON.stringify(food));
            console.log(new_food);
            //new_food._id = req.body._id;
            new_food.shop = {
                name : shop.name,
                _id : shop._id,
                status : shop.status
            }

        io.emit('food_change', new_food);

        res.status(201).send({ status: "success" });
    })



    return router
}