const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

var ObjectId = mongoose.Schema.Types.ObjectId;

const itemSchema = new mongoose.Schema({
    name : {
        type: String,
        required : true
    },

    price : {
        type : Number,
        required: true
    },

    amount : {
        type : Number,
        required: true
    }

})

const orderSchema = new mongoose.Schema({
    shopId: {
        type : ObjectId,
        required: true
    },
    studentId: {
        type: ObjectId,
        required : true
    },
    items : {
        type : Array,
        required : true
    },
    status : {
        type : String,        
        default : "created"
    },
    createdAt:{
        type : Date,
        default : new Date()
    }        
});

/*userSchema.pre('save', async function (next) {
    // Hash the password before saving the user model
    const user = this
    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8)
    }
    next()
})

userSchema.methods.generateAuthToken = async function() {
    // Generate an auth token for the user
    const user = this
    const token = jwt.sign({_id: user._id}, process.env.JWT_KEY)
    user.tokens = user.tokens.concat({token})
    await user.save()
    return token
}

userSchema.statics.findByCredentials = async (email, password) => {
    // Search for a user by email and password.
    const user = await User.findOne({ email} )
    if (!user) {
        throw new Error({ error: 'Invalid login credentials' })
    }
    const isPasswordMatch = await bcrypt.compare(password, user.password)
    if (!isPasswordMatch) {
        throw new Error({ error: 'Invalid login credentials' })
    }
    return user
}*/


const Order = mongoose.model('Order', orderSchema);
module.exports = Order