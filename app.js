const express = require("express");
require('dotenv').config();
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const path = require("path");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const localStrategy = require("passport-local");



const dataModule = require('./public/js/data.js');
const DataModel = require('./models/Data'); // Adjust the path if necessary

const Test = require('./models/Test');
const User = require('./models/User');






const blogsrouter = require("./routes/blogs.js");
const jobsrouter = require("./routes/jobs.js");
const userrouter = require("./routes/user.js");
const testrouter = require("./routes/testseries.js");
const questionbankrouter = require("./routes/questionbank.js");
const batchrouter = require("./routes/batch.js");
const otprouter = require("./routes/otp.js");

const app = express();
const port = 8000;


const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const upload = multer({ dest: 'uploads/' });
const fs = require('fs');
const { error } = require("console");

// Configure Cloudinary
cloudinary.config({
    cloud_name:process.env.cloud_name, 
    api_key:process.env.api_key, 
    api_secret:process.env.api_Secret
});


// Connect to MongoDB
mongoose.connect(process.env.mongo_url);

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.use(express.json());

const store = MongoStore.create({
  mongoUrl:process.env.mongo_url,
  crypto:{
    secret: process.env.secret,
  },
  touchAfter: 24*3600
})

store.on("error", ()=>{
  console.log("error in connecting mongo session store",error)
})

const sessionOptions = {
  store,
  secret: process.env.secret,
  resave:false,
  saveUninitialized:true,
  cookie:{
    expires: Date.now() + 3*24*60*60*1000,
    maxAge: 3*24*60*60*1000,
    httpOnly: true,
  }
}

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


app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user;
  next();
});

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
// app.use(fileUpload())



// app.get('/currentaffairs', async (req, res) => {

//     const allListing = await currentaffair.find({});
//     res.render('currentaffair',{allListing});

// });

app.use("/blogs",blogsrouter);
app.use("/jobs",jobsrouter);
app.use("/user",userrouter);
app.use("/user",otprouter);
app.use("/test",testrouter);
app.use("/",questionbankrouter);
app.use("/",batchrouter);

app.get("/", (req,res)=>{
  res.render("./index.ejs")
})

app.get("/admin", ensureAuthenticated,isAdmin,(req,res)=>{
  res.render("./admin/admin-index.ejs")
})


// app.get('/some-route',ensureAuthenticated, (req, res) => {
//     console.log(currUser);
// });




app.get('/currentaffairs/create/new', (req,res) => {
  res.render('listings/create');
})

// Route to handle submitted data
app.post('/submit-data', async (req, res) => {
    const { data } = req.body;
    if (Array.isArray(data)) {
        try {

          var d = new Date();
          const date = d.getDate();
          const month = d.getMonth();
          const y = d.getYear();
          const year = y-100;
          const newData = new DataModel({ 
            text: data,
            date:date,
            month:month,
            year:year
        });
        await newData.save();
            res.status(200).send('Data submitted');
        } catch (error) {
            console.error('Error saving data:', error);
            res.status(500).send('Error saving data');
        }
    } else {
        res.status(400).send('Invalid data format');
    }
    console.log(data)
});

app.get('/currentaffairs', async (req, res) => {
  const allListing = await DataModel.find({});
  res.render('./listings/showall',{allListing});
});

app.post('/get/currentaffair/by/month', async (req, res) => {
  var selectedOption = req.body.selectedOption;
  const allListing = await DataModel.find({month : selectedOption});
  res.render('./listings/show',{allListing});
});

// TEST SERIES


//Test DELETE Route

app.delete('/admin/delete/test/:id', async (req, res) => {
  const itemId = req.params.id;
    try {
        const result = await Test.findByIdAndDelete(itemId);
        if (result) {
            return res.status(200).json({ message: 'Item deleted successfully!' });
        } else {
            return res.status(404).json({ error: 'Item not found.' });
        }
    } catch (error) {
        return res.status(500).json({ error: 'Error deleting item.' });
    }
});


// Student Route - Render test attempt page
app.get('/student/tests',ensureAuthenticated, async (req, res) => {
  const tests = await Test.find(); // Fetch all tests from the database
  res.render('./testseries/student-tests.ejs', { tests });
});

app.get('/student/test/:id', async (req, res) => {
  const test = await Test.findById(req.params.id);
  res.render('./studenttestinterface/attempt-test.ejs', { test });
});

// app.get('/student/test/:id', async (req, res) => {
//   const test = await Test.findById(req.params.id);
//   res.render('./testseries/attempt2.ejs', { test });
// });

// Handle test submission and calculate the score
app.post('/student/test/:testId', async (req, res) => {
  const testId = req.params.testId;
  const answers = req.body.answers || {}; // Use an empty object as default if answers are undefined
  const test = await Test.findById(testId); // Fetch the test from your database
  let score = 0;

  // Check if the test and questions exist
  if (!test || !test.questions) {
      return res.status(400).send('Test not found.');
  }

  // Iterate through the questions and compare answers
  test.questions.forEach((question, index) => {
      const userAnswer = answers[index]; // This will be undefined if the question was skipped
      if (userAnswer !== undefined) { // Only check if the answer exists
          if (question.correctAnswer == userAnswer) {
              score += 4;
          } else{
            score -= 1;
          }
      }
      
  });

  // Here, you can save the score or whatever you need to do with the results
  res.send(`Your score is: ${score}/${test.questions.length*4}`);
});

// Admin Route - List all tests
app.get('/admin/tests', async (req, res) => {
  const tests = await Test.find({}); // Fetch all tests from the database
  res.render('./testseries/admin-test', { tests });
});


app.get("/user/complaint",(req,res)=>{
  res.render("./complaints/student-window.ejs")
})

//Student-Complaint
app.post("/user/complaint",(req,res)=>{
  res.send("hello")
})


// Start server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
