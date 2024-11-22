const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const Subject = require('../models/Subject');
const Chapter = require('../models/Chapter');
const Topic = require('../models/Topic');
const Question = require('../models/Question');
const Test = require('../models/Test');

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


  function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    res.redirect('/user/login');
  }  


router.get('/create/question/bank',ensureAuthenticated, async(req,res) =>{
    res.render('./questionbank/createques.ejs')
  })

  router.get('/create',ensureAuthenticated, async (req, res) => {
    res.render('./testseries/TestFromQuestionBank.ejs');
  });
  
router.get('/api/subjects',ensureAuthenticated, async (req,res) => {
    const subjects = await Subject.find({})
    res.json(subjects);
  })
  
router.get('/api/chapters/:name',ensureAuthenticated, async (req,res) => {
    const {name} = req.params;
    const chapter = await Chapter.find({SubjectName : name})
    res.json(chapter);
  })
  
router.get('/api/topics/:name',ensureAuthenticated, async (req,res) => {
    const {name} = req.params;
    const chapter = await Topic.find({ChapterName : name})
    res.json(chapter);
  })
  
router.get('/api/questions/:name',ensureAuthenticated, async (req,res) => {
    const {name} = req.params;
    const chapter = await Question.find({TopicName : name})
    res.json(chapter);
  })  
  
  router.post('/create-ques', upload.single("file"), async (req, res) => {
    try {
      const { subject, chapter, topic, correct } = req.body;
      const result = await Upload.uploadFile(req.file.path);  // Use the path for Cloudinary upload
      const imageUrl = result.secure_url;
  
      // After upload, delete the file from local storage
      fs.unlink(req.file.path, (err) => {
        if (err) {
          console.error('Error deleting local file:', err);
        } else {
          console.log('Local file deleted successfully');
        }
      });
  
      const newQuestion = new Question({
        SubjectName: subject,
        ChapterName: chapter,
        TopicName: topic,
        Question: imageUrl,
        Option1: "Option 1",
        Option2: "Option 2",
        Option3: "Option 3",
        Option4: "Option 4",
        CorrectOption: correct,
      });
  
      await newQuestion.save();
      res.status(200).json({ message: 'Question created successfully!' });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: 'Upload failed: ' + error.message });
    }
  });
  
  
router.get('/create/information',ensureAuthenticated, (req,res) => {
    res.render('./questionbank/createinfo.ejs')
  })
  
router.post('/create/subject', async(req,res) => {
    try{
      let {subject} = req.body;
      const newsubject = new Subject({ 
                            Name: subject
                           });
      await newsubject.save();
    }catch(error){
      res.send(error)
    }
  })
  
router.post('/create/chapter', async(req,res) => {
     try{
      let {subject,chapter} = req.body;
      const newsubject = new Chapter({ 
                            SubjectName:subject,
                            ChapterName:chapter
                           });
      await newsubject.save();
    }catch(error){
      res.send(error)
    }
  })
  
router.post('/create/topic', async(req,res) => {
     try{
      let {subject,chapter,topic} = req.body;
      const newsubject = new Topic({ 
                              SubjectName:subject,
                              ChapterName:chapter,
                              TopicName:topic
                             });
       await newsubject.save();
    }catch(error){
      res.send(error)
    }
  })
  


module.exports = router;
