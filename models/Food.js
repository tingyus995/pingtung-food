const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
var ObjectId = mongoose.Schema.Types.ObjectId;

const foodSchema = new mongoose.Schema({
    name: {
        type : String,
        required : true,
        minlength: 1
    },

    price : {
        type: Number,
        required : true        
    },
    
    createdAt : {
        type: Date,
        default: new Date()
    },
    modifiedAt : {
        type : Date,
        default: new Date()
    },
    likes : {
        type : Array,
        default : []
    },
    tags : {
        type : Array,
        default : []
    },
    picture : {
        type : String,
        required : true
    },
    shopId : {
        type : ObjectId
    }
});

foodSchema.pre('save', async function (next) {
    // Hash the password before saving the user model
    const food = this
    food.modifiedAt = new Date()
    next()
})

/*foodSchema.methods.generateAuthToken = function() {
    // Generate an auth token for the user
    const user = this
    const token = jwt.sign({name : user.name, email: user.email, _id: user._id, type: 'shop', created: new Date()}, "my_jwt_key")    
    return token
}

foodSchema.statics.findByCredentials = async (email, password) => {
    // Search for a user by email and password.
    const user = await Shop.findOne({ email} )
    if (!user) {
        throw { error: 'Invalid login credentials' }
    }
    const isPasswordMatch = await bcrypt.compare(password, user.password)
    if (!isPasswordMatch) {
        throw { error: 'Invalid login credentials' }
    }
    return user
}*/


const Food = mongoose.model('Food', foodSchema);
module.exports = Food