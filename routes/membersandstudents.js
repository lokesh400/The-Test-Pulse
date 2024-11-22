const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const Team = require('../models/Team');


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

  function isAdmin(req, res, next) {
    if (req.isAuthenticated() && req.user.role === 'admin') {
      return next();
    }
    res.render("./error/accessdenied.ejs");
  }

router.get('/create/new/team',ensureAuthenticated,isAdmin,(req,res)=>{
    req.flash('error_msg', `Hello Sir @ ${req.user.name}`);
    res.render('./admin/create-team.ejs')
})

router.post('/create/new/team/member', upload.single("file"), async (req, res) => {
    try {
        // Check if the file was uploaded
        if (!req.file) {
            req.flash('error_msg', 'No file uploaded.');
            return res.redirect('/create/new/team');
        }

        // Destructure and validate request body
        const { Name, Subject, College } = req.body;
        console.log(Name, Subject, College)
        if (!Name || !Subject || !College) {
            req.flash('error_msg', 'All fields are required.');
            return res.redirect('/create/new/team');
        }
        // Upload file and get URL
        const result = await Upload.uploadFile(req.file.path);
        const imageUrl = result.secure_url;

        // Delete local file after upload
        fs.unlink(req.file.path, (err) => {
            if (err) {
                console.error('Error deleting local file:', err);
            } else {
                console.log('Local file deleted successfully');
            }
        });

        // Create new team document
        const newTeam = new Team({ 
            name: Name,
            college: College,
            subject: Subject,
            photo: imageUrl,
        });

        // Save to database
        await newTeam.save();
        req.flash('success_msg', 'Team Member Added Successfully');
        res.redirect('/create/new/team'); // Redirect to the form page or any other page

    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Upload failed. Please try again.'); // Set error flash message
        res.redirect('/create/new/team'); // Redirect back to the form page or error page
    }
});


  
module.exports = router;
