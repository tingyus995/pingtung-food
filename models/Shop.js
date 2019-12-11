const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const shopSchema = new mongoose.Schema({
    name: String,
    email: {
        type: String,
        required : true,
        unique: true,
        lowercase : true,
        validate: value => {
            if (!validator.isEmail(value)) {
                throw new Error({error: 'Invalid Email address'})
            }
        }
    },
    password : {
        type: String,
        required : true,
        minlength : 5
    },
    createdAt : {
        type: Date,
        default: Date.now
    }
});

shopSchema.pre('save', async function (next) {
    // Hash the password before saving the user model
    const user = this
    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8)
    }
    next()
})

shopSchema.methods.generateAuthToken = function() {
    // Generate an auth token for the user
    const user = this
    const token = jwt.sign({name : user.name, email: user.email, _id: user._id, type: 'shop', created: new Date()}, process.env.JWT_KEY)    
    return token
}

shopSchema.statics.findByCredentials = async (email, password) => {
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
}


const Shop = mongoose.model('Shop', shopSchema);

module.exports = Shop
