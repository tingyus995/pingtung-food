const mongoose = require('mongoose')

// connect to mongoDB
mongoose.connect('mongodb+srv://ptfood:ptfoodisexcellent@pingtung-food-xdqjo.gcp.mongodb.net/test?retryWrites=true&w=majority', {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: true
})