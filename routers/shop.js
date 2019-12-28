const express = require('express')
const Shop = require('../models/Shop')
const auth = require('../middleware/shop_auth')
const email = require('../email')();
const bcrypt = require('bcryptjs');


module.exports = (io, socketIDs) => {

    function getRandomInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }


    let vertificationCodes = {};


    const router = express.Router()


    router.post('/code', async (req, res) => {
        let data = req.body;


        let re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        if (!data) {
            res.status(400).send({ status: "error", msg: "No email provided." })
            return;
        }
        if (!data.email) {
            res.status(400).send({ status: "error", msg: "No email provided." })
            return;
        }

        if (!re.test(data.email)) {
            res.status(400).send({ status: "error", msg: "E-mail format invalid." })
            return;
        }

        if(!data.type){
            res.status(400).send({ status: "error", msg: "No type specified." })
        }
    
        let code = getRandomInt(10000, 99999);
        console.log("Code:" + code);
    
        let shop = await Shop.findOne({ email: data.email });
        if (data.type === 'reset') {
            if (!shop) {
                res.status(400).send({ status: "error", msg: "Account not found." });
                return;
            } else {
                email.send(data.email, "探索屏東美食密碼重設驗證碼", "以下是您的重設驗證碼：" + code + "。請不要告訴他人自己的驗證碼。若您未於本平台重設密碼，建議立即登入並改變您帳號的密碼。");
            }
    
    
        }else if (data.type === 'create') {
            console.log("debug 58");
            console.log(shop);
            if (shop) {
                res.status(400).send({ status: "error", msg: "Account already existed." });
                return;
            } else {
                console.log("sending email...");
                email.send(data.email, "探索屏東美食註冊驗證碼", "感謝您加入探索屏東美食的店家合作夥伴，以下是您的驗證碼：" + code + "。請不要告訴他人自己的驗證碼。若您未於本平台申請帳號，請忽略此訊息。");
            }
    
        }else{
            res.status(400).send({ status: "error", msg: "Unsupported type." });
            return;
        }
        vertificationCodes[data.email] = code;
        setTimeout(function () {
            console.log("Deleting vertification code:");
            console.log(data.email);
            console.log(vertificationCodes[data.email]);
            delete vertificationCodes[data.email];
        }, 120 * 1000)
        res.send({ status: 'ok' });
    })   
    
    
    router.post('/vertification', async (req, res) => {
        let data = req.body;
        let re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        if (!data) {
            res.status(400).send({ status: "error", msg: "No information provided." })
            return;
        }
        if(!data.email){
            res.status(400).send({ status: "error", msg: "No email provided." })
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
        if(!vertificationCodes[req.body.user.email] === req.body.code){
            res.status(400).send({status : 'error', msg : "Vertification code invalid."});
            return;
        }
        try {
            const user = new Shop(req.body.user);
            await user.save()
            const token = await user.generateAuthToken()
            //res.status(201).send({ user: user, token })
            res.send({ user: { type: 'shop', _id: user._id, name: user.name, email: user.email, status: user.status }, token })
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

            const shop = await Shop.findOneAndUpdate({ _id: req.user._id }, {
                name: req.body.name,
                email: req.body.email
            }, {
                new: true
            });
            io.emit('shop_change', shop);


            // notify shop itself
            if (socketIDs[req.user._id]) {
                socketIDs[req.user._id].forEach(sid => {
                    io.to(sid).emit('shop_change_self', {
                        _id: shop._id,
                        name: shop.name,
                        status: shop.status
                    })
                });
            }



            res.status(201).send({ status: 'success' })
        } catch (error) {
            res.status(400).send(error)
        }
    })

    router.put('/status', auth, async (req, res) => {

        let data = req.body;
        console.log(data);
        if (!data) {
            res.status(400).send({ status: "error", msg: "No query provided." })
            return;
        }

        if (!data.status) {
            res.status(400).send({ status: "error", msg: "No status provided." });
            return;
        }

        let allowed_method = ["open", "closed", "full"];

        if (allowed_method.indexOf(data.status) === -1) {
            res.status(400).send({ status: "error", msg: "Status not supported." })
            return;
        }
        // get the order doc
        let shop;
        try {
            shop = await Shop.findOne({ _id: req.user._id });
        } catch (e) {
            console.log(e);
            res.status(400).send({ status: "error", msg: "Shop cannot be found." })
            return;
        }
        console.log("shop");
        console.log(shop);

        if (data.status === shop.status) {
            res.status(400).send({ status: "error", msg: "Shop status not changed." })
            return;
        } else {
            shop.status = data.status;
        }

        console.log(shop);
        await shop.save();
        console.log("shop saved.");

        //if(socketIDs[ord.studentId]){
        console.log("notifying all students");
        io.emit('shop_change', {
            _id: shop._id,
            name: shop.name,
            status: shop.status
        });
        // notify shop itself
        if (socketIDs[req.user._id]) {
            socketIDs[req.user._id].forEach(sid => {
                io.to(sid).emit('shop_change_self', {
                    _id: shop._id,
                    name: shop.name,
                    status: shop.status
                })
            });
        }


        //}

        res.status(201).send({ status: "success" });
    })

    router.put('/changepasswd', auth, async (req, res) => {
        // Create a new user
        try {
            //const user = new Shop(req.body)
            //await user.save()
            //const token = await user.generateAuthToken()

            const matched = await bcrypt.compare(req.body.original_password, req.user.password);

            if (matched) {
                console.log("password matched.");
                console.log(req.body.password);
                await Shop.findOneAndUpdate({ _id: req.user._id }, {
                    password: await bcrypt.hash(req.body.password, 8)
                }, {
                    new: false
                });
                console.log("updated");
                res.status(201).send({ status: 'success' })
            } else {
                throw { message: "original password incorrect." }
            }

        } catch (error) {
            console.log(error);
            res.status(400).send(error)
        }
    })

    router.post('/resetpasswd', async (req, res) => {
        // Create a new user
    
        if (!req.body.code) {
            res.status(400).send({ status: 'error', msg: 'Vertification code not provided.' });
            return;
        }
        if (!req.body.password) {
            res.status(400).send({ status: 'error', msg: 'New password not provided.' });
            return;
        }
        if (!req.body.email) {
            res.status(400).send({ status: 'error', msg: 'New password not provided.' });
            return;
        }
    
        if (vertificationCodes[req.body.email] !== parseInt(req.body.code)) {
            res.status(400).send({ status: 'error', msg: 'Vertification code invalid.' });
            return;
        }
    
    
    
    
        try {
            //const user = new Shop(req.body)
            //await user.save()
            //const token = await user.generateAuthToken()
    
    
    
            //const matched =  await bcrypt.compare(req.body.original_password, req.user.password);
    
    
            await Shop.findOneAndUpdate({ email: req.body.email }, {
                password: await bcrypt.hash(req.body.password, 8)
            }, {
                new: true
            });
            console.log("updated");
            console.log("deleting code...");
            delete vertificationCodes[req.body.email];
            res.status(201).send({ status: 'success' })
    
    
    
    
    
        } catch (error) {
            console.log(error);
            res.status(400).send(error)
        }
    })

    router.post('/login', async (req, res) => {
        console.log("debug login");
        //Login a registered user
        try {
            const { email, password } = req.body
            console.log("email:", email)
            console.log("password:", password)
            const user = await Shop.findByCredentials(email, password)
            if (!user) {
                return res.status(401).send({ error: 'Login failed! Check authentication credentials' })
            }
            const token = await user.generateAuthToken()
            console.log(token);
            console.log("user");
            console.log(user);
            res.send({ user: { type: 'shop', _id: user._id, name: user.name, email: user.email, status: user.status }, token })
        } catch (error) {
            res.status(400).send(error);
        }
    })

    router.get('/', auth, async (req, res) => {
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

    return router
}