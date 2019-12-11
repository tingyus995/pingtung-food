const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const studentSchema = new mongoose.Schema({
    name: String,
    email: {
        type: String,
        required : true,
        unique: true,
        lowercase : true,
        validate: value => {
            if (!validator.isEmail(value) || !value.endsWith('@nptu.edu.tw')) {
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

studentSchema.pre('save', async function (next) {
    // Hash the password before saving the user model
    const user = this
    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8)
    }
    next()
})

studentSchema.methods.generateAuthToken = function() {
    // Generate an auth token for the user
    const user = this
    const token = jwt.sign({name : user.name, email: user.email, _id: user._id, type: 'student', created: new Date()}, process.env.JWT_KEY)    
    return token
}

studentSchema.statics.findByCredentials = async (email, password) => {
    // Search for a user by email and password.
    const user = await Student.findOne({ email} )
    if (!user) {
        throw { error: 'Invalid login credentials' }
    }
    const isPasswordMatch = await bcrypt.compare(password, user.password)
    if (!isPasswordMatch) {
        throw { error: 'Invalid login credentials' }
    }
    return user
}


const Student = mongoose.model('Student', studentSchema);

module.exports = Student
