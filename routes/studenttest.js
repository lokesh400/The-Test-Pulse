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

//Route to render result
router.get('/student/test/:id/result', ensureAuthenticated, async (req, res) => {
  try {
    const testId = req.params.id;
    const studentId = req.user._id;

    // Fetch the test and student answers
    const test = await Test.findById(testId);
    const studentTest = await StudentTest.findOne({ studentId, testId });

    res.render("studenttestinterface/result", {
    test,
    studentTest
    });


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


// router.post(
//   "/student/test/:testId",
//   ensureAuthenticated,
//   async (req, res) => {
//     try {
//       const { testId } = req.params;
//       const studentId = req.user._id;
//       console.log(req.body);

//       const test = await Test.findById(testId).lean();
//       if (!test || !test.questions?.length) {
//         return res.status(404).send("Test not found");
//       }

//       const solution = req.body.solution || {};
//       let score = 0;
//       const answers = [];

//       // Map questions for fast lookup
//       const questionMap = new Map(
//         test.questions.map(q => [q._id.toString(), q])
//       );

//       // Evaluate submitted answers
//       for (const [questionId, selectedOption] of Object.entries(solution)) {
//         const question = questionMap.get(questionId);
//         if (!question) continue;

//         let isCorrect = "not";

//         if (selectedOption === "-1") {
//           // Not attempted
//           isCorrect = "not";
//         } else if (Number(selectedOption) === Number(question.correctAnswer)) {
//           score += 4;
//           isCorrect = "yes";
//         } else {
//           score -= 1;
//           isCorrect = "no";
//         }

//         answers.push({
//           questionId,
//           selectedOption: Number(selectedOption),
//           isCorrect,
//           questionUrl: question.questionText
//         });

//         // Remove handled question
//         questionMap.delete(questionId);
//       }

//       // Remaining questions → not attempted
//       for (const [qid, q] of questionMap.entries()) {
//         answers.push({
//           questionId: qid,
//           selectedOption: -1,
//           isCorrect: "not",
//           questionUrl: q.questionText
//         });
//       }

//       // Remove previous attempt if exists
//       await StudentTest.findOneAndDelete({ studentId, testId });

//       // Save fresh attempt
//       await StudentTest.create({
//         studentId,
//         testId,
//         score,
//         answers
//       });

//       return res.redirect(`/student/test/${testId}/result`);
//     } catch (err) {
//       console.error("TEST SUBMIT ERROR:", err);
//       return res.status(500).send("Internal Server Error");
//     }
//   }
// );

router.post(
  "/student/test/:testId",
  ensureAuthenticated,
  async (req, res) => {
    try {
      const { testId } = req.params;
      const studentId = req.user._id;

      const test = await Test.findById(testId).lean();
      if (!test || !test.questions || test.questions.length === 0) {
        return res.status(404).send("Test not found");
      }

      const solution = req.body.solution || {};
      const timeSpentMap = req.body.timeSpent || {};

      let score = 0;
      const answers = [];

      // Map questions for O(1) lookup
      const questionMap = new Map(
        test.questions.map(q => [q._id.toString(), q])
      );

      for (const [questionId, question] of questionMap.entries()) {
        const rawOption = solution[questionId];
        const rawTime = timeSpentMap[questionId];

        // ✅ HARD SANITIZATION (NO NaN POSSIBLE)
        const selectedOption = Number.isInteger(Number(rawOption))
          ? Number(rawOption)
          : -1;

        const timeSpent = Number.isFinite(Number(rawTime))
          ? Number(rawTime)
          : 0;

        let isCorrect = "not";

        if (selectedOption === -1) {
          isCorrect = "not";
        } else if (selectedOption === question.correctAnswer) {
          score += 4;
          isCorrect = "yes";
        } else {
          score -= 1;
          isCorrect = "no";
        }

        answers.push({
          questionId,
          selectedOption,
          isCorrect,
          timeSpent
        });
      }

      // Remove previous attempt if exists
      await StudentTest.findOneAndDelete({ studentId, testId });

      // Save new attempt
      await StudentTest.create({
        studentId,
        testId,
        score,
        answers
      });

      return res.redirect(`/student/test/${testId}/result`);
    } catch (err) {
      console.error("TEST SUBMIT ERROR:", err);
      return res.status(500).send("Internal Server Error");
    }
  }
);


module.exports = router;