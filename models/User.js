const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  Name : String,
  Email : String,
  Password:String,
});

const User = mongoose.model('User', UserSchema);

module.exports = User;