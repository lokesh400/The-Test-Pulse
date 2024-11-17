const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const Subject = require('../models/Subject');
const Chapter = require('../models/Chapter');
const Topic = require('../models/Topic');
const Question = require('../models/Question');
// const Test = require('../models/Test');

const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const upload = multer({ dest: 'uploads/' });
const fs = require('fs');
const { error } = require("console");


cloudinary.config({
    cloud_name:process.env.cloud_name, 
    api_key:process.env.api_key, 
    api_secret:process.env.api_Secret
});


const Upload = {
    uploadFile: async (filePath) => {
      try {
        const result = await cloudinary.uploader.upload(filePath);
        return result;
      } catch (error) {
        throw new Error('Upload failed: ' + error.message);
      }
    },
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
      const result = await Upload.uploadFile(req.file.path);
      const imageUrl = result.secure_url;

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
          CorrectOption: correct
      });

      await newQuestion.save();

      // req.flash('success_msg', 'Question created successfully!'); // Set success flash message
      // res.redirect('/create/question/bank'); // Redirect to the form page or any other page
      res.status(200).json({ message: 'Question created successfully!' });
  } catch (error) {
      // console.error(error);
      // req.flash('error_msg', 'Upload failed.'); // Set error flash message
      // res.redirect('/create/question/bank'); // Redirect back to the form page or error page
      res.status(500).json({ message: error })
  }
});

router.post('/create-ques/text', upload.single("file"), async (req, res) => {
  try {
      const { subject, chapter, topic, correct,question } = req.body;

      const newQuestion = new Question({ 
          SubjectName: subject,
          ChapterName: chapter,
          TopicName: topic,
          Question: question,
          Option1: "Option 1",
          Option2: "Option 2",
          Option3: "Option 3",
          Option4: "Option 4",
          CorrectOption: correct
      });

      await newQuestion.save();
      res.status(200).json({ message: 'Question created successfully!' });
  } catch (error) {
      res.status(500).json({ message: error })
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
