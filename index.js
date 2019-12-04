const mongoose = require('mongoose');
const JWT_KEY = "secret_jwt_key"

mongoose.connect('mongodb+srv://ptfood:ptfoodisexcellent@pingtung-food-xdqjo.gcp.mongodb.net/test?retryWrites=true&w=majority', {useNewUrlParser: true});
let db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
    console.log("Database connected.");
});

let userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password : String,

    historyOrders : [{
        food : {
            name : String,
            amount : Number,
            price: Number
        },
        status : String, // finished | abandoned | rejected
        message : String
    }]    
});

userSchema.methods.generateAuthToken = async function() {
    // Generate an auth token for the user
    const user = this
    const token = jwt.sign({_id: user._id}, JWT_KEY)
    user.tokens = user.tokens.concat({token})
    await user.save()
    return token
}


let User = mongoose.model('User', userSchema);

/*let TingYu = new User({
    name : "TingYuYan",
    email : "cbe107019@nptu.edu.tw",
    password : "cbe107019",
    historyOrders : []
})*/

/*TingYu.save(function(err, user){
    if(err) console.log(err);
    console.log(user);
})*/


const server = require('http').createServer();
const io = require('socket.io')(server);
io.on('connection', client => {
  client.on('sign_up', data => {
    console.log("[sign_up]", data);
    


  });
  client.on('disconnect', () => { /* … */ });
});
server.listen(3000);