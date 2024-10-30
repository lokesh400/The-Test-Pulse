const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const Question = require('../models/Question');

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

  function isAdmin(req, res, next) {
    if (req.isAuthenticated() && req.user.role === 'admin') {
      return next();
    }
    res.render("./error/accessdenied.ejs");
  }

router.get('/create/new/team',ensureAuthenticated,isAdmin,(req,res)=>{
    res.render('./admin/create-team.ejs')
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

      req.flash('success_msg', 'Question created successfully!'); // Set success flash message
      res.redirect('/create/question/bank'); // Redirect to the form page or any other page
  } catch (error) {
      console.error(error);
      req.flash('error_msg', 'Upload failed.'); // Set error flash message
      res.redirect('/create/question/bank'); // Redirect back to the form page or error page
  }
});

  
router.get('/create/information',ensureAuthenticated, (req,res) => {
    res.render('./questionbank/createinfo.ejs')
  })

module.exports = router;
