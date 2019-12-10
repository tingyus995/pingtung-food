const express = require('express')
const port = 3030
const studentRouter = require('./routers/student')
const shopRouter = require('./routers/shop')
const foodRouter = require('./routers/food')
const orderRouter = require('./routers/order')
const cors = require('cors');
require('./db/db')

const app = express()
app.use(cors())
app.use(express.json())
app.use('/student',studentRouter)
app.use('/shop', shopRouter)
app.use('/food',foodRouter)
app.use('/order', orderRouter)
app.listen(port, () => {
    console.log(`Server running on port ${port}`)
})
