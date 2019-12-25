const express = require('express')
const port = 3030
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
        try{
        const data = jwt.verify(token, process.env.JWT_KEY);
        console.log(data);
        socketIDs[data._id] = socket.id;
        }catch(e){
            console.log(e);
        }
    })

    socket.on('disconnect',() => {
        let index = Object.values(socketIDs).indexOf(socket.id);
        delete socketIDs[Object.keys(socketIDs)[index]];
    })
    
    socket.emit("hello", {msg : "Hello world!"});
})

server.listen(port);

app.use(cors())
app.use(express.json())
app.use('/student',studentRouter)
app.use('/shop', shopRouter(io, socketIDs))
app.use('/food',foodRouter(io, socketIDs))
app.use('/order', orderRouter(io, socketIDs))
/*app.listen(port, () => {
    console.log(`Server running on port ${port}`)
})*/