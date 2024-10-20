const express = require("express");
const router = express.Router();
const Job = require('../models/Job');



router.get('/newopenings', async (req, res) => {
    res.render('./listings/job/new');
  });
  
router.post('/new', async (req, res) => {
    const {opdate,endate,title,qual,link} = req.body
    const end = endate.toString();
    const qu = qual.toString();
  
    try {
      const newJob = new Job({ 
        startingdate:opdate,
        closingdate:end,
        title:title,
        link:link,
        Qualification:qu,
      });
      await newJob.save();
      res.send('data saved');
    } catch (error) {
      res.status(500).send('Error saving data');
    }
  });
  
  
router.get('/allopenings', async (req, res) => {
    const JobData = await Job.find({});
    res.render('./listings/job/all',{JobData});
  });

module.exports = router;  