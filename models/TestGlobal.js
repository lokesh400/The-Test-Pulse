const mongoose = require('mongoose');

const TestGlobalSchema = new mongoose.Schema({
    Questions:Array,
});

const TestGlobal = mongoose.model('TestGlobal', TestGlobalSchema);

module.exports = TestGlobal;