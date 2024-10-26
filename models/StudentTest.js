const mongoose = require('mongoose');

const studentTestSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Student' },
  testId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Test' },
  score: { type: Number, required: true },
  answers: [
    {
      questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
      selectedOption: { type: Number },
      isCorrect: { type: Boolean, required: true },
    }
  ],
});

module.exports = mongoose.model('StudentTest', studentTestSchema);
