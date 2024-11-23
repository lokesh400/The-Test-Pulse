const express = require("express");
const router =  express.Router();
const User = require('../models/User');
const Test = require('../models/Test');
const Batch = require('../models/Batch');

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

  //ADMIN ROUTE TO ALL USERS
router.get('/admin/allusers',async (req, res) => {
      const users = await User.find({})
      res.render('./admin/all-users.ejs',{users});
  });

router.get("/admin", ensureAuthenticated,isAdmin,(req,res)=>{
    res.render("./admin/admin-index.ejs")
  })
  
router.get("/student",ensureAuthenticated,async (req,res)=>{
    req.flash('success_msg', 'Login Successfull');
    const allBatches = await Batch.find({});
    res.render("./student.ejs",{allBatches})
  })
  
router.get("/terms-and-conditions",(req,res)=>{
    res.render("./users/terms-and-conditions.ejs")
  })
  
router.get("/privacy-policy",(req,res)=>{
    res.render("./users/privacy-policy.ejs")
  });
  
 
// ADMIN ROUTE TO DELETE A TEST  
router.delete('/admin/delete/test/:id', async (req, res) => {
    const testId = req.params.id; // Get the test ID from the request parameters
    try {
        // First, delete the test from the Test collection
        const result = await Test.findByIdAndDelete(testId);
        if (!result) {
            return res.status(404).json({ error: 'Test not found.' });
        }
  
        // Then, remove it from all batches that contain it in the `tests` array
        const updateResult = await Batch.updateMany(
            { tests: testId }, // Find batches containing the test ID
            { $pull: { tests: testId } } // Remove the test ID from the tests array
        );
  
        // Optionally, you can check how many batches were modified
        if (updateResult.modifiedCount > 0) {
            return res.status(200).json({ message: 'Test deleted successfully from all batches!' });
        } else {
            return res.status(200).json({ message: 'Test deleted successfully, but not found in any batches.' });
        }
    } catch (error) {
        console.log('Error deleting test:', error);
        return res.status(500).json({ error });
    }
  });
  
  // Admin Route - List all tests
router.get('/admin/tests', async (req, res) => {
    const tests = await Test.find({}); // Fetch all tests from the database
    res.render('./testseries/admin-test', { tests });
  });
  
router.get('/admin/test/:id', async (req, res) => {
    const test = await Test.findById(req.params.id);
    res.render('./admin/print-test.ejs', { test });
  });
  
router.get("/user/complaint",(req,res)=>{
    res.render("./complaints/student-window.ejs")
  })
  


module.exports = router;
