const express = require("express");
const router =  express.Router();
const Test = require('../models/Test');
const Batch = require('../models/Batch');

const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const upload = multer({ dest: 'uploads/' });
const fs = require('fs');

const Upload = {
    uploadFile: async (filePath) => {
      try {
        const result = await cloudinary.uploader.upload(filePath);
        return result; // Return the upload result
      } catch (error) {
        throw new Error('Upload failed: ' + error.message);
      }
    },
  };


  
  //ADMIN ROUTE TO CREATE NEW BATCH
router.get('/admin/createnewbatch', async (req, res) => {
      res.render('./batch/createbatchindex.ejs');
  });

// Post request of above route
router.post('/admin/create/batch', upload.single("file"), async (req, res) => {
    try {
     const {name,grade} = req.body;
     const result = await Upload.uploadFile(req.file.path);
     const imageUrl = result.secure_url
     fs.unlink(req.file.path, (err) => {
       if (err) {
         console.error('Error deleting local file:', err);
       } else {
         console.log('Local file deleted successfully');
       }
     });
     const newBatch = new Batch({ 
       title:name,
       thumbnail : imageUrl,
       class:grade,
       tests:[]
     });
     await newBatch.save();
   } catch (error) {
     console.error(error);
     res.status(500).send('Upload failed.');
   }
  });  
  
  //All Batches
router.get('/showallbatches', async (req, res) => {
   const allBatches = await Batch.find({});
    res.render('./batch/showallbatches.ejs',{allBatches});
  });
  
// show a particular requested batch
router.get('/showbatch/:id', async (req, res) => {
    const {id} = req.params;
    console.log(id)
    const thisBatch = await Batch.findById(id);
    res.render('./batch/particularbatchhome.ejs',{thisBatch});
   });
  
// Route to include tests in a batch
router.get('/update-batch/:id', async (req, res) => {
    const {id} = req.params;
    const tests = await Test.find();
    res.render('./batch/createbatch.ejs',{ tests,id });
  });

//Post route to include a test in batch
router.post('/create/:id/:testId', async (req, res) => {
    try {
      let { id, testId } = req.params; // Extracting id and name from params
      const newte = await Batch.findById(testId); // Find the batch by title
      if (!newte) {
        return res.status(404).json({ message: 'Batch not found' }); // Handle case where batch is not found
      }
      newte.tests.push(id); 
      await newte.save();
      res.redirect('/showallbatches')
    }
      catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  
module.exports = router;
