const express = require("express");
const router =  express.Router();
const Subject = require('../models/Subject');
const Chapter = require('../models/Chapter');
const Topic = require('../models/Topic');
const Question = require('../models/Question');
const Test = require('../models/Test');


router.get('/admin/create', (req, res) => {
  res.render('./testseries/createtest.ejs');
});

router.get('/create', async (req, res) => {
    res.render('./testseries/TestFromQuestionBank.ejs');
  });
  
router.get('/api/subjects', async (req,res) => {
    const subjects = await Subject.find({})
    res.json(subjects);
  })
  
router.get('/api/chapters/:name', async (req,res) => {
    const {name} = req.params;
    const chapter = await Chapter.find({SubjectName : name})
    res.json(chapter);
  })
  
router.get('/api/topics/:name', async (req,res) => {
    const {name} = req.params;
    const chapter = await Topic.find({ChapterName : name})
    res.json(chapter);
  })
  
router.get('/api/questions/:name', async (req,res) => {
    const {name} = req.params;
    const chapter = await Question.find({TopicName : name})
    res.json(chapter);
  })
  
  
router.post('/secondlastfinalsubmit', async (req, res) => {
    const selectedOptions = req.body.options; // options will be an array
    let data =[];
    
    for(let i=0;i<selectedOptions.length;i++){
       let ques = await Question.findById(selectedOptions[i]); 
       let data2 = data.push(ques)
    }
     res.render('./testseries/TestFromQuestionBank2.ejs',{data});
});

// Handle form submission for creating a test
router.post('/final-submit', async (req, res) => {
  const { title, questions,time } = req.body;
  const formattedQuestions = questions.map(q => ({
    questionText: q.questionText,
    options: q.options,
    correctAnswer: q.correctAnswer,
  }));
  const newTest = new Test({ title, questions: formattedQuestions ,time});
  await newTest.save();
  const tests = await Test.find({});
  res.render('./testseries/admin-test', { tests });
});
  
module.exports = router;
