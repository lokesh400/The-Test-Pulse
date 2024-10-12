const mongoose = require('mongoose');

const monthSchema = new mongoose.Schema({
  Month:{
    date:String,
    Info:String,
  }
});

const month = mongoose.model('month', monthSchema);

module.exports = month;