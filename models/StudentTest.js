const mongoose = require("mongoose");

const answerSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: true
    },
    selectedOption: {
      type: Number,
      default: -1   // -1 = not attempted
    },
    isCorrect: {
      type: String,
      enum: ["yes", "no", "not"],
      required: true
    },
    timeSpent: {
      type: Number,   // seconds
      default: 0,
      min: 0
    }
  },
  { _id: false }
);

const studentTestSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    testId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Test",
      required: true,
      index: true
    },
    score: {
      type: Number,
      required: true
    },
    answers: [answerSchema]
  },
  { timestamps: true }
);

module.exports = mongoose.model("StudentTest", studentTestSchema);
