const mongoose = require('mongoose');

const   BatchSchema = new mongoose.Schema({
     title:String,
     thumbnail:String,
     class:String,
     tests:Array,
     tag:String,
     description:String,
     announcements:Array,
});

const Batch = mongoose.model('Batch', BatchSchema);

module.exports = Batch;