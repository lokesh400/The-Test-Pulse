const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
    startingdate:Date,
    closingdate:Date,
    title:String,
    link:String
});

const Job = mongoose.model('Job', JobSchema);

module.exports = Job;