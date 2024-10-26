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
router.get('/student/test/:id', async (req, res) => {
  const test = await Test.findById(req.params.id);
  res.render('./studenttestinterface/attempt-test.ejs', { test });
});

//Route to submit student response
router.post('/student/test/:testId', async (req, res) => {
    const testId = req.params.testId;
    const studentId = req.user._id; // Assumes you have a session with the student's ID
    const answers = req.body.answers || {};
    const test = await Test.findById(testId);
    let score = 0;
    const results = [];
  
    if (!test || !test.questions) {
        return res.status(400).send('Test not found.');
    }

    const totalQuestions = test.questions.length; // Total number of questions
    const totalMarks = totalQuestions * 4; // Total marks possible

    test.questions.forEach((question, index) => {
        const userAnswer = answers[index];
        const isCorrect = userAnswer == question.correctAnswer;

        if (userAnswer !== undefined) {
            score += isCorrect ? 4 : -1; // Adjust score
        }

        // Save answer result for each question
        results.push({
            questionId: question._id,
            selectedOption: userAnswer,
            isCorrect,
        });
    });

    // Save student test attempt with score and answer results
    await StudentTest.findOneAndUpdate(
        { studentId, testId },
        { score, totalMarks, answers: results }, // Save both score and totalMarks
        { upsert: true } // Create a new document if one doesn’t exist
    );

    res.redirect(`/student/test/${testId}/result`);
});


//Route to render result
// router.get('/student/test/:id/result', async (req, res) => {
//     const testId = req.params.id;
//     const studentId = req.user._id; // assuming the user session contains the student ID

//     // Fetch test data
//     const test = await Test.findById(testId).populate('questions');

//     // Fetch previously saved answers for this test by the student
//     const studentTest = await StudentTest.findOne({ studentId, testId });
//     const savedAnswers = studentTest ? studentTest.answers : [];

//     // Calculate total marks and counts
//     const totalQuestions = test.questions.length;
//     let correctCount = 0;
//     let incorrectCount = 0;
//     let skippedCount = 0;

//     savedAnswers.forEach(answer => {
//         if (answer.selectedOption === null) {
//             skippedCount++; // Count it as skipped if there's no answer selected
//         } else if (answer.isCorrect) {
//             correctCount++; // Count it as correct if the answer is correct
//         } else {
//             incorrectCount++; // Otherwise, count it as incorrect
//         }
//     });

//     const totalMarks = totalQuestions * 4; // Assuming each question is worth 4 marks
//     const obtainedMarks = studentTest ? studentTest.score : 0; // Fetch the obtained score

//     // Render a results page with both test, saved answers, and summary data
//     res.render('./studenttestinterface/test-result.ejs', {
//         test,
//         savedAnswers,
//         totalMarks,
//         obtainedMarks, // Pass obtained marks to the template
//         totalQuestions,
//         correctCount,
//         incorrectCount,
//         skippedCount
//     });
// });

router.get('/student/test/:id/result', async (req, res) => {
    const testId = req.params.id;
    const studentId = req.user._id; // assuming the user session contains the student ID

    // Fetch test data
    const test = await Test.findById(testId).populate('questions');

    // Fetch previously saved answers for this test by the student
    const studentTest = await StudentTest.findOne({ studentId, testId });
    const savedAnswers = studentTest ? studentTest.answers : [];

    // Calculate total marks and counts
    const totalQuestions = test.questions.length;
    let correctCount = 0;
    let incorrectCount = 0;
    let skippedCount = 0;

    savedAnswers.forEach(answer => {
        if (answer.selectedOption === null) {
            skippedCount++; // Count it as skipped if there's no answer selected
        } else if (answer.isCorrect) {
            correctCount++; // Count it as correct if the answer is correct
        } else {
            incorrectCount++; // Otherwise, count it as incorrect
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
    res.render('./studenttestinterface/test-result.ejs', {
                test,
                savedAnswers,
                totalMarks,
                obtainedMarks, // Pass obtained marks to the template
                totalQuestions,
                correctCount,
                incorrectCount,
                skippedCount
            });
});

module.exports = router;