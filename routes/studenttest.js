const express = require("express");
const router = express.Router();
const nodemailer = require('nodemailer');
// const pdf = require('html-pdf');
const StudentTest = require('../models/StudentTest');
const Test = require('../models/Test')


function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    res.redirect('/user/login');
  }

router.get('/student/tests',ensureAuthenticated, async (req, res) => {
  const tests = await Test.find(); // Fetch all tests from the database
  res.render('./testseries/student-tests.ejs', { tests });
});


//Route to render test choden by studet
router.get('/student/test/:id',ensureAuthenticated, async (req, res) => {
    const testId = req.params.id;
    const studentId = req.user._id
    const studentTest = await StudentTest.findOne({ studentId, testId });
    const test = await Test.findById(testId);
    const Type = test.testMode;

    if(studentTest && req.user.role === 'student' && Type === 'Real'){
        res.render("./studenttestinterface/already-attempted.ejs");
    }
   else {
    const test = await Test.findById(req.params.id);
    res.render('./studenttestinterface/attempt-test.ejs', { test });
  }
});


router.post('/student/test/:testId', ensureAuthenticated, async (req, res) => {

const testId = req.params.testId;
const studentId = req.user._id; 
let score = 0;
const answers = [];
const solution = req.body.solution || {};
const keys = Object.keys(solution);
const test = await Test.findById(testId);
if (!test || !test.questions) {
    return res.status(400).send('Test not found.');
}

const totalQuestions = test.questions.length; // Total number of questions
const totalMarks = totalQuestions * 4; // Total marks possible
Object.entries(solution).forEach(function([key, value]) {
    const question = test.questions.find(q => q._id.toString() === key);
    if (question) {
        if (value === question.correctAnswer) {
            score += 4; // Assuming each question is worth 4 points
            answers.push({
                questionId: key,
                selectedOption: value,
                isCorrect: "yes"
            });
        } 
        else if (value === "-1") {
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
    });
await studentTest.save();
    res.redirect(`/student/test/${testId}/result`);
});

  

//Route to render result
router.get('/student/test/:id/result', ensureAuthenticated, async (req, res) => {
  try {
    const testId = req.params.id;
    const studentId = req.user._id;

    // Fetch the test and student answers
    const test = await Test.findById(testId);
    const studentTest = await StudentTest.findOne({ studentId, testId });

    if (!studentTest) {
      return res.send("Please Attempt The Test");
    }

    const savedAnswers = studentTest.answers;
    const totalQuestions = test.questions.length;

    // Determine section ranges
    const physicsEnd = Math.floor(totalQuestions / 3);
    const chemistryEnd = Math.floor((2 * totalQuestions) / 3);

    // Map question IDs to their section
    const questionSectionMap = {};
    test.questions.forEach((q, index) => {
      const qId = q._id.toString();
      if (index < physicsEnd) {
        questionSectionMap[qId] = 'Physics';
      } else if (index < chemistryEnd) {
        questionSectionMap[qId] = 'Chemistry';
      } else {
        questionSectionMap[qId] = 'Mathematics';
      }
    });

    // Initialize section stats
    const sections = {
      Physics: { total: 0, correct: 0, incorrect: 0, skipped: 0, positive: 0, negative: 0 },
      Chemistry: { total: 0, correct: 0, incorrect: 0, skipped: 0, positive: 0, negative: 0 },
      Mathematics: { total: 0, correct: 0, incorrect: 0, skipped: 0, positive: 0, negative: 0 }
    };

    // Process each answer
    savedAnswers.forEach(answer => {
      const section = questionSectionMap[answer.questionId] || 'Unknown';
      if (!sections[section]) return; // Ignore if section not mapped

      sections[section].total++;

      if (answer.isCorrect === 'yes') {
        sections[section].correct++;
        sections[section].positive += 4;
      } else if (answer.isCorrect === 'no') {
        sections[section].incorrect++;
        sections[section].negative += 1;
      } else {
        sections[section].skipped++;
      }
    });

    const totalMarks = totalQuestions * 4;
    const obtainedMarks = studentTest.score;

    res.render('studenttestinterface/result.ejs', {
      totalMarks,
      obtainedMarks,
      sections
    });

  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});


module.exports = router;