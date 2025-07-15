const express = require("express");
const passport = require("passport");
const User = require("../../models/User");
const QuesOfDay = require("../../models/QuesOfDay");
const Answer = require("../../models/Answer");
const Batch = require("../../models/Batch");

const router = express.Router()

const multer = require('multer');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const { error } = require("console");

cloudinary.config({
    cloud_name:process.env.cloud_name, 
    api_key:process.env.api_key, 
    api_secret:process.env.api_secret
});

// Multer disk storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Save files to 'uploads/' folder
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    // Use the original file name
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

// Initialize multer with diskStorage
const upload = multer({ storage: storage });

// Function to upload files to Cloudinary
const Upload = {
  uploadFile: async (filePath) => {
    try {
      // Upload the file to Cloudinary
      const result = await cloudinary.uploader.upload(filePath, {
        resource_type: "auto", // Auto-detect file type (image, video, etc.)
      });
      return result;
    } catch (error) {
      throw new Error('Upload failed: ' + error.message);
    }
  }
};


// const QuestionSchema = new mongoose.Schema({
//   text: String,
//   correctAnswer: String,
//   batch: String,
//   postedAt: { type: Date, default: Date.now },
// });
// const Question = mongoose.model("Question", QuestionSchema);

// const AnswerSchema = new mongoose.Schema({
//   studentId: String,
//   questionId: mongoose.Types.ObjectId,
//   answer: String,
//   isCorrect: Boolean,
//   attemptedAt: Date,
//   timeTaken: Number, // in seconds
// });
// const Answer = mongoose.model("Answer", AnswerSchema);

// const LeaderboardSchema = new mongoose.Schema({
//   studentId: String,
//   batch: String,
//   totalPoints: Number,
//   totalCorrect: Number,
//   totalTimeTaken: Number,
//   averageTime: Number,
//   week: String,
// });
// const Leaderboard = mongoose.model("Leaderboard", LeaderboardSchema);

// Helper to get current week string
const getWeek = () => moment().format("YYYY-[W]WW");

router.get('/ques/of/day/:id', (req,res)=>{
    res.render('admin/quesofday.ejs',{batchId:req.params.id})
})

router.post('/create/ques/of/the/day', upload.single("file"), async (req, res) => {
    try {
      const { batchId,subject,correctAnswer } = req.body;
      const result = await Upload.uploadFile(req.file.path);  // Use the path for Cloudinary upload
      const imageUrl = result.secure_url;
      fs.unlink(req.file.path, (err) => {
        if (err) {
          console.error('Error deleting local file:', err);
        } else {
          console.log('Local file deleted successfully');
        }
      });
      const newQuestion = new QuesOfDay({
        SubjectName:subject,
        correctAnswer,
        batchId,
        Question:imageUrl
      });
  
      await newQuestion.save();
      res.status(200).json({ message: 'Question created successfully!' });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: 'Upload failed: ' + error.message });
    }
  });

router.get("/questions/today/all", async (req, res) => {
  const  studentId  = req.user.id;

  const user = await User.findById(studentId);
  if (!user) return res.status(404).json({ error: "User not found" });
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const questions = await QuesOfDay.find({
    batchId: { $in: user.purchasedBatches },
    postedAt: { $gte: startOfDay },
  }).populate("batchId","title").sort({ SubjectName: 1 }).lean();

  console.log(questions)


  res.json(questions);
});


router.post("/question/answer", async (req, res) => {
    console.log("hitted")
  const studentId = req.user._id;
  const { questionId, answer } = req.body;

  if (!questionId || answer === undefined) {
    return res.status(400).json({ error: "Missing question or answer" });
  }

  try {
    const already = await Answer.findOne({ studentId, questionId });
    if (already) return res.status(400).json({ error: "Already answered" });

    const question = await QuesOfDay.findById(questionId);
    if (!question) return res.status(404).json({ error: "Question not found" });

    const isCorrect = String(answer) === String(question.correctAnswer);

    await Answer.create({
      studentId,
      questionId,
      answer,
      isCorrect,
    });

    res.json({ message: "Answer submitted", isCorrect });
  } catch (err) {
    console.error("Answer Error:", err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// Leaderboard route
router.get("/leaderboard", async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).lean();
    if (!user) return res.status(404).json({ error: "User not found" });

    const batchIds = user.purchasedBatches || [];

    const startOfWeek = new Date();
    startOfWeek.setHours(0, 0, 0, 0);
    const daysSinceMonday = (startOfWeek.getDay() + 6) % 7; // 0 = Sunday → 6, 1 = Monday → 0
    startOfWeek.setDate(startOfWeek.getDate() - daysSinceMonday);

    // Fetch all answers from this week for user's batches
    const answers = await Answer.find({
      answeredAt: { $gte: startOfWeek },
    })
      .populate("studentId", "username")
      .populate({
        path: "questionId",
        select: "batchId",
        populate: { path: "batchId", select: "name" },
      })
      .lean();

    const leaderboard = {};
    const batchMap = {};

    for (const ans of answers) {
      const question = ans.questionId;
      if (!question || !question.batchId) continue;

      const batchId = question.batchId._id.toString();
      const batchname = await Batch.findById(question.batchId);
      const batchName = batchname.title
    //   const batchName = question.batchId.name || "Unknown Batch";

      batchMap[batchId] = batchName;
      const student = ans.studentId;
      if (!student) continue;

      if (!leaderboard[batchId]) leaderboard[batchId] = {};

      const key = student._id.toString();
      if (!leaderboard[batchId][key]) {
        leaderboard[batchId][key] = {
          userId: key,
          username: student.username,
          points: 0,
          totalTime: 0,
        };
      }

      if (ans.isCorrect) leaderboard[batchId][key].points += 10;
      leaderboard[batchId][key].totalTime += ans.timeTaken || 0;
    }

    const result = [];

    for (const [batchId, studentsMap] of Object.entries(leaderboard)) {
      const allStudents = Object.values(studentsMap).sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        return a.totalTime - b.totalTime;
      });

      const top10 = allStudents.slice(0, 10);
      const myIndex = allStudents.findIndex((s) => s.userId === userId.toString());
      const myRank = myIndex >= 0 ? myIndex + 1 : null;
      const myData = myRank ? allStudents[myIndex] : null;

      result.push({
        batchId,
        batchName: batchMap[batchId] || "Unknown Batch",
        top10,
        myRank,
        myData,
      });
    }

    res.json(result);
  } catch (err) {
    console.error("Leaderboard error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});


// app.get("/api/admin/leaderboard", async (req, res) => {
//   const { batch } = req.query;
//   const week = getWeek();
//   const leaderboard = await Leaderboard.find({ batch, week })
//     .sort([["totalPoints", -1], ["averageTime", 1]])
//     .lean();
//   res.json(leaderboard);
// });

// // Student Routes
// app.get("/api/question/today", async (req, res) => {
//   const { batch } = req.query;
//   const today = moment().startOf("day");
//   const question = await Question.findOne({
//     batch,
//     postedAt: { $gte: today.toDate() },
//   }).lean();
//   res.json(question);
// });

// app.post("/api/question/answer", async (req, res) => {
//   const { studentId, questionId, answer } = req.body;
//   const existing = await Answer.findOne({ studentId, questionId });
//   if (existing) return res.status(400).json({ error: "Already answered" });

//   const question = await Question.findById(questionId);
//   const isCorrect = answer.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase();
//   const attemptedAt = new Date();
//   const timeTaken = Math.floor((attemptedAt - question.postedAt) / 1000);

//   await Answer.create({ studentId, questionId, answer, isCorrect, attemptedAt, timeTaken });

//   const week = getWeek();
//   const lb = await Leaderboard.findOne({ studentId, batch: question.batch, week });

//   if (lb) {
//     if (isCorrect) {
//       lb.totalPoints += 10;
//       lb.totalCorrect += 1;
//       lb.totalTimeTaken += timeTaken;
//       lb.averageTime = lb.totalTimeTaken / lb.totalCorrect;
//     }
//     await lb.save();
//   } else {
//     await Leaderboard.create({
//       studentId,
//       batch: question.batch,
//       totalPoints: isCorrect ? 10 : 0,
//       totalCorrect: isCorrect ? 1 : 0,
//       totalTimeTaken: isCorrect ? timeTaken : 0,
//       averageTime: isCorrect ? timeTaken : 0,
//       week,
//     });
//   }

//   res.json({ success: true, isCorrect });
// });

// app.get("/api/leaderboard", async (req, res) => {
//   const { batch } = req.query;
//   const week = getWeek();
//   const leaderboard = await Leaderboard.find({ batch, week })
//     .sort([["totalPoints", -1], ["averageTime", 1]])
//     .lean();
//   res.json(leaderboard);
// });

  
module.exports = router;