// models/Role.js

const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  Name : String,
  Number : Number,
  Email : String,
  College: String,
  Role : String,
});

const Role = mongoose.model('Role', roleSchema);

module.exports = Role;
