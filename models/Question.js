const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
    SubjectName : String,
    ChapterName : String,
    TopicName: String,
    Question : String,
    Option1 : String,
    Option2 : String,
    Option3 : String,
    Option4: String,
    CorrectOption:Number
});

const Question = mongoose.model('Question', QuestionSchema);

module.exports = Question;