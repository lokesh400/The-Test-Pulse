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
  const testId = req.params.id;
      const studentId = req.user._id
      const studentTest = await StudentTest.findOne({ studentId, testId });
      const test = await Test.findById(testId);
      const Type = test.testMode;
      if(studentTest && req.user.role === 'student' && Type === 'Real'){
          res.json({message:"Test Already Taken"});
      }
     else {
      const test = await Test.findById(req.params.id);
      res.json(test);
    }
});

router.post("/:testId/submit", async (req, res) => {
  try {
    const { testId } = req.params;
    const studentId = req.user._id;
    const { answer = {} } = req.body;

    const test = await Test.findById(testId);

    if (!test || !test.questions) {
      return res.status(404).json({ error: "Test not found" });
    }

    let score = 0;
    let correct = 0;
    let incorrect = 0;
    let skipped = 0;

    const answers = [];

    // evaluate submitted answers
    for (const [questionId, selectedOption] of Object.entries(answer)) {
      const q = test.questions.find(q => q._id.toString() === questionId);
      if (!q) continue;
      const cloudUrl = q.Question || null;
      const correctAnswer = q.correctAnswer;
      const isSkipped = selectedOption.toString() === "-1";
      if (isSkipped) {
        skipped++;
        answers.push({
          questionId,
          selectedOption,
          isCorrect: "not",
          correctAnswer,
          questionUrl: cloudUrl
        });
      } 
      else if (selectedOption.toString() === correctAnswer.toString()) {
        correct++;
        score += 4;
        answers.push({
          questionId,
          selectedOption,
          isCorrect: "yes",
          correctAnswer,
          questionUrl: cloudUrl
        });
      } 
      else {
        incorrect++;
        score -= 1;
        answers.push({
          questionId,
          selectedOption,
          isCorrect: "no",
          correctAnswer,
          questionUrl: cloudUrl
        });
      }
    }
    // detect unanswered questions
    const submittedIds = Object.keys(answer);
    const unanswered = test.questions.filter(
      q => !submittedIds.includes(q._id.toString())
    );

    unanswered.forEach(q => {
      skipped++;
      answers.push({
        questionId: q._id.toString(),
        selectedOption: -1,
        isCorrect: "not",
        correctAnswer: q.correctAnswer,
        questionUrl: q.imageUrl || null
      });
    });

    // prevent duplicate attempts
    await StudentTest.findOneAndDelete({ studentId, testId });

    const totalQuestions = test.questions.length;
    const totalMarks = totalQuestions * 4;

    const studentTest = new StudentTest({
      studentId,
      testId,
      answers,
      score,
      correct,
      incorrect,
      skipped,
      totalMarks
    });

    // console.log(studentTest)

    await studentTest.save();



    res.status(200).json({
      message: "Submission successful",
      score,
      correct,
      incorrect,
      skipped,
      totalMarks
    });

  } catch (error) {
    console.error("Submit error:", error);
    res.status(500).json({ error: "Server failure" });
  }
});


// to render student result
router.get('/report/:id', async (req, res) => {
    try{
     const testId = req.params.id;
     const studentId = req.user._id; // assuming the user session contains the student ID
     const test = await Test.findById(testId).populate('questions');
     var studentTest = await StudentTest.findOne({ studentId, testId });

        if (!studentTest) {
            return res.status(404).json({ error: 'Test attempt not found' });
        }

        for (let i = 0; i < studentTest.answers.length; i++) {
            const que = await Question.findById("6790558af83a021203013c48");
            console.log(que)
            if (que) {
                studentTest.answers[i].questionUrl = que.Question;
            }
        }  

        // console.log(studentTest)
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
