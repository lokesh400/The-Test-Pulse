const express = require("express");
const passport = require("passport");
const User = require("../../models/User");
const Batch = require("../../models/Batch");
const Test = require("../../models/Test")
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
                isCorrect: "yes"
            });
        } 
        else if (value.toString() === "-1") {
            score += 0;
            answers.push({
                questionId: key,
                selectedOption: value,
                isCorrect: "not"
            });
        } 
        else {
            score -= 1;
            answers.push({
                questionId: key,
                selectedOption: value,
                isCorrect: "no"
            });
        }
    }
});
const questionIds = answers.map(answer => answer.questionId);

const filteredQuestions = test.questions
      .filter(question => !questionIds.includes(question._id.toString()))
      .map(question => question._id.toString());

for(let i=0;i<filteredQuestions.length;i++){
    answers.push({
        questionId: filteredQuestions[i],
        selectedOption: -1,
        isCorrect: "not"
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
console.log(score,answer)
   res.status(200).json({ message: "Submission successful" });
});


module.exports = router;
