const mongoose = require('mongoose');

const   BatchSchema = new mongoose.Schema({
     title:String,
     thumbnail:String,
     class:String,
     tests:Array
});

const Batch = mongoose.model('Batch', BatchSchema);

module.exports = Batch;