const express = require('express')
const port = process.env.PORT || 3030
const studentRouter = require('./routers/student')
const shopRouter = require('./routers/shop')
const foodRouter = require('./routers/food')
const orderRouter = require('./routers/order')
const cors = require('cors');
const jwt = require('jsonwebtoken')
require('./db/db')

const app = express()
const server = require('http').Server(app);
var io = require('socket.io')(server);


let socketIDs = {}


io.on('connection', socket => {
    console.log("user connected.");
    socket.on('auth', token => {
        try {
            const data = jwt.verify(token, process.env.JWT_KEY);
            console.log(data);
            if (socketIDs[data._id]) {
                socketIDs[data._id].push(socket.id);
            } else {
                socketIDs[data._id] = [socket.id];
            }
            console.log("after auth: ");
            console.log(socketIDs);
        } catch (e) {
            console.log(e);
        }
    })

    socket.on('disconnect', () => {
        //let index = Object.values(socketIDs).indexOf(socket.id);        

        let userId = -1;
        let idxToDelete = -1;

        let kv = Object.entries(socketIDs);

        for (let i = 0; i < kv.length; ++i) {
            let item = kv[i];

            let id = item[0];
            let s_id = item[1];

            let idx = s_id.indexOf(socket.id);

            if (idx !== -1) {
                userId = id;
                idxToDelete = idx;
                break;
            }
        }
        if (userId !== -1) {
            if (socketIDs[userId]) {
                socketIDs[userId].splice(idxToDelete, 1);
                if (socketIDs[userId].length === 0) {
                    delete socketIDs[userId];
                }
                console.log("after deleting...");
                console.log(socketIDs);
                //delete socketIDs[Object.keys(socketIDs)[index]];
            }
        }
    })

    socket.emit("hello", { msg: "Hello world!" });
})

server.listen(port);

app.use(cors())
app.use(express.json())
app.use('/student', studentRouter)
app.use('/shop', shopRouter(io, socketIDs))
app.use('/food', foodRouter(io, socketIDs))
app.use('/order', orderRouter(io, socketIDs))
/*app.listen(port, () => {
    console.log(`Server running on port ${port}`)
})*/