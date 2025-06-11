const express = require("express");
const passport = require("passport");
const User = require("../../models/User");
const Batch = require("../../models/Batch");
const Test = require("../../models/Test");
const Question = require("../../models/Question");
const mongoose = require("mongoose")
const StudentTest = require("../../models/StudentTest")

const router = express.Router()

router.get("/:id", async (req, res) => {
  const test = await Test.findById(req.params.id);
  res.json(test);
});

router.post('/:testId/submit', async (req, res) => {

const testId = req.params.testId;
const studentId = req.user._id; 
let score = 0;
const answers = [];
const {answer} = req.body || {};
const solution = answer;
const keys = Object.keys(solution);
const test = await Test.findById(testId);
if (!test || !test.questions) {
    return res.status(400).send('Test not found.');
}

const totalQuestions = test.questions.length; // Total number of questions
const totalMarks = totalQuestions * 4; // Total marks possible
Object.entries(answer).forEach(function([key, value]) {
    const question = test.questions.find(q => q._id.toString() === key);
    if (question) {
        if (value.toString() === question.correctAnswer) {
            score += 4; // Assuming each question is worth 4 points
            answers.push({
                questionId: key,
                selectedOption: value,
                isCorrect: "yes",
                questionUrl:question.questionText
            });
        } 
        else if (value.toString() === "-1") {
            score += 0;
            answers.push({
                questionId: key,
                selectedOption: value,
                isCorrect: "not",
                questionUrl:question.questionText
            });
        } 
        else {
            score -= 1;
            answers.push({
                questionId: key,
                selectedOption: value,
                isCorrect: "no",
                questionUrl:question.questionText
            });
        }
    }
});
const questionIds = answers.map(answer => answer.questionId);

const filteredQuestions = test.questions
  .filter(question => !questionIds.includes(question._id.toString()))
  .map(question => ({
    id: question._id.toString(),
    ques: question.questionText // or whatever field contains the text
  }));


for(let i=0;i<filteredQuestions.length;i++){
    answers.push({
        questionId: filteredQuestions[i].id,
        selectedOption: -1,
        isCorrect: "not",
        questionUrl: filteredQuestions[i].ques
    });
}

const alreadyTest = await StudentTest.findOne({ studentId, testId });
if(alreadyTest){
    await StudentTest.deleteOne({ _id: alreadyTest._id });
}
    const studentTest = new StudentTest({
        studentId: studentId,  // Student's ObjectId
        testId: testId,        // Test's ObjectId
        score: score,          // Score obtained by the student
        answers: answers       // Array of answers (questions and selected options)
    })
await studentTest.save();
   res.status(200).json({ message: "Submission successful" });
});

// to render student result
router.get('/report/:id', async (req, res) => {
    try{
     const testId = req.params.id;
     const studentId = req.user._id; // assuming the user session contains the student ID
     const test = await Test.findById(testId).populate('questions');
     const studentTest = await StudentTest.findOne({ studentId, testId });
        if (!studentTest) {
            return res.status(404).json({ error: 'Test attempt not found' });
        }

        // Calculate scores
        const totalQuestions = test.questions.length;
        let correctCount = 0;
        let incorrectCount = 0;
        let skippedCount = 0;

        studentTest.answers.forEach(answer => {
            if (answer.isCorrect === "not") {
                skippedCount++;
            } else if (answer.isCorrect === "yes") {
                correctCount++;
            } else if (answer.isCorrect === "no") {
                incorrectCount++;
            }
        });

        // Prepare response data
        const enhancedData = {
            ...studentTest.toObject(),
            score: correctCount * 4 - incorrectCount,
            correct: correctCount,
            incorrect: incorrectCount,
            skipped: skippedCount,
            totalMarks: totalQuestions * 4,
            testName: test.name, // Include test name if available
            testDescription: test.description // Include other relevant test info
        };
        res.json(enhancedData);
    } catch (error) {
        console.error('Error in /report/:id:', error);
        res.status(500).json({ 
            error: 'Server error',
            message: error.message 
        });
    }
});

module.exports = router;
