const mongoose = require("mongoose");

const AnswerSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  questionId: { type: mongoose.Schema.Types.ObjectId, ref: "QuesOfDay", required: true },
  answer: { type: String, required: true }, // option index as string, e.g., "0"
  isCorrect: { type: Boolean },
  answeredAt: { type: Date, default: Date.now },
});

AnswerSchema.index({ studentId: 1, questionId: 1 }, { unique: true }); // prevent duplicates

module.exports = mongoose.model("Answer", AnswerSchema);
