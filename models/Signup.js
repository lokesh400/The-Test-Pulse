const mongoose = require('mongoose');

const SignupSchema = new mongoose.Schema({
  Name : String,
//   Number : Number,
  Email : String,
//   College: String,
//   Role : String,
  Password:String,
});

const Signup = mongoose.model('Signup', SignupSchema);

module.exports = Signup;