const mongoose = require('mongoose');
const JWT_KEY = "secret_jwt_key"

mongoose.connect('mongodb+srv://ptfood:ptfoodisexcellent@pingtung-food-xdqjo.gcp.mongodb.net/test?retryWrites=true&w=majority', {useNewUrlParser: true});
let db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
    console.log("Database connected.");
});



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

  client.on('')

  client.on('disconnect', () => { /* … */ });
});
server.listen(3000);