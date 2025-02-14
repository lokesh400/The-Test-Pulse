const express = require("express");
const router = express.Router();
const nodemailer = require('nodemailer');
const pdf = require('html-pdf');
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
router.get('/student/test/:id/result',ensureAuthenticated, async (req, res) => {
   try{
    const testId = req.params.id;
    const studentId = req.user._id; // assuming the user session contains the student ID
    // Fetch test data
    const test = await Test.findById(testId).populate('questions');
    // Fetch previously saved answers for this test by the student
    const studentTest = await StudentTest.findOne({ studentId, testId });
    const savedAnswers = studentTest.answers;
    // Calculate total marks and counts
    const totalQuestions = test.questions.length;
    let correctCount = 0;
    let incorrectCount = 0;
    let skippedCount = 0;

    savedAnswers.forEach(answer => {
        if (answer.isCorrect === "not") {
            skippedCount++; // Count it as skipped if there's no answer selected
        } else if (answer.isCorrect === "yes") {
            correctCount++; // Count it as correct if the answer is correct
        } else if (answer.isCorrect === "no") {
            incorrectCount++; // Count it as correct if the answer is correct
        }
    });

    const totalMarks = totalQuestions * 4; // Assuming each question is worth 4 marks
    const obtainedMarks = studentTest ? studentTest.score : 0; // Fetch the obtained score

    // Render the result page to get the HTML content
    const htmlContent = await new Promise((resolve, reject) => {
        res.render('./studenttestinterface/test-result.ejs', {
            test,
            savedAnswers,
            totalMarks,
            obtainedMarks, // Pass obtained marks to the template
            totalQuestions,
            correctCount,
            incorrectCount,
            skippedCount,
        }, (err, html) => {
            if (err) reject(err);
            else resolve(html);
        });
    });

    // Create a PDF from the HTML content
    pdf.create(htmlContent).toBuffer(async (err, buffer) => {
        if (err) return res.status(500).send('Error creating PDF.');

        // Send the PDF via email
        try {
            const transporter = nodemailer.createTransport({
                service:'gmail',
                host:'smtp.gmail.com',
                secure:false,
                port:587,
                auth:{
                     user:"lokeshbadgujjar401@gmail.com",
                     pass:process.env.mailpass
            }
            });

            const mailOptions = {
                from: 'your-email@gmail.com',
                to: req.user.email, // The student's email
                subject: 'Your Test Results',
                text: 'Please find attached your test results.',
                attachments: [{
                    filename: 'test-results.pdf',
                    content: buffer,
                    contentType: 'application/pdf'
                }],
            };

            await transporter.sendMail(mailOptions);
        } catch (error) {
            console.error(error);
        }
    });
    if(!studentTest){
        res.send("Please Attempt The Test")
    }
    else{
        res.render('./studenttestinterface/test-result.ejs', {
            test,
            savedAnswers,
            totalMarks,
            obtainedMarks,
            totalQuestions,
            correctCount,
            incorrectCount,
            skippedCount
        });
    }
   } catch(error){
    console.log(error)
    res.send(error)
   }
});

module.exports = router;