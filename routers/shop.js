const express = require('express')
const Shop = require('../models/Shop')
const auth = require('../middleware/shop_auth')
const bcrypt = require('bcryptjs');


module.exports = (io, socketIDs) => {

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

            const shop = await Shop.findOneAndUpdate({ _id: req.user._id }, {
                name: req.body.name,
                email: req.body.email
            }, {
                new: true
            });
            io.emit('shop_change', shop);
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
            res.send({ user: { type: 'shop', _id: user._id, name: user.name, email: user.email, status : user.status }, token })
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