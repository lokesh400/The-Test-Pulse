const mongoose = require('mongoose');
const passportLocalMongoose = require("passport-local-mongoose");


const AddressSchema = new mongoose.Schema({
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  postalCode: { type: String, required: true },
  country: { type: String, required: true },
  addresses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Address' }],
});

const UserSchema = new mongoose.Schema({
  name:{
    type:String,
  },
  contactNumber:{
    type:Number,
  },
  role:{
    type:String
  },
  email:{
    type:String,
    required:true,
  },
  username:{
    type:String,
    required:true,
  },
  testScore:{
    type:Number,
  },
  purchasedBatches:Array,
});

UserSchema.plugin(passportLocalMongoose);

const User = mongoose.model('User', UserSchema);

module.exports = User;