const mongoose = require('mongoose');
const passportLocalMongoose = require("passport-local-mongoose");

const UserSchema = new mongoose.Schema({
  email:{
    type:String,
    required:true,
  },
  username:{
    type:String,
    required:true,
  }
});

UserSchema.plugin(passportLocalMongoose);

const User = mongoose.model('User', UserSchema);

module.exports = User;

// Name:{
//   type:String,
//   required:true,
// },
// email:{
//   type:String,
//   required:true,
// },
// password:{
//   type:String,
//   required:true,
// },
// accountType:{
//   type:String,
//   enum:["Admin","Student","Instructor"]
// },
// additionalDetails:{
//   type:mongoose.Schema.Types.ObjectId,
//   ref:"Profile",
// },
// courses:{
//   type:mongoose.Schema.Types.ObjectId,
//   ref:"Course",
// },