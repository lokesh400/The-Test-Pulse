const mongoose = require('mongoose');
const User = require('./User.js');
const Test = require('./Test.js');

const studentTestSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  testId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Test' },
  score: { type: Number, required: true },
  answers: [
    {
      questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
      selectedOption: { type: Number },
      isCorrect: String,
    }
  ],
});

module.exports = mongoose.model('StudentTest', studentTestSchema);
