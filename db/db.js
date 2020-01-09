const mongoose = require('mongoose')

// connect to mongoDB
mongoose.connect(process.env.DB_CONN, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: true
})
