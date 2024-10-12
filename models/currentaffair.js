const mongoose = require('mongoose');

const currentaffairSchema = new mongoose.Schema({
  Info:Array, 
});

const currentaffair = mongoose.model('currentaffair', currentaffairSchema);

module.exports = currentaffair;