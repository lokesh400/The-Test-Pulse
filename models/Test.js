const mongoose = require('mongoose');

// Question Schema
const QuestionSchema = new mongoose.Schema({
  questionText: String,
  options: [String],
  correctAnswer: Number,
   // Store the index (0-3) of the correct option
});

// Test Schema
const TestSchema = new mongoose.Schema({
  title: String,
  questions: [QuestionSchema],
  time:Number,
});

const Test = mongoose.model('Test', TestSchema);

module.exports = Test;