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
const Batch = require('./models/Batch');


const blogsrouter = require("./routes/blogs.js");
const jobsrouter = require("./routes/jobs.js");
const userrouter = require("./routes/user.js");
const testrouter = require("./routes/testseries.js");
const questionbankrouter = require("./routes/questionbank.js");
const batchrouter = require("./routes/batch.js");
const otprouter = require("./routes/otp.js");
const studenttestrouter = require("./routes/studenttest.js");

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
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
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
app.use("/",studenttestrouter);

app.get("/", (req,res)=>{
  if (req.isAuthenticated() && req.user.role === 'admin') {
    res.redirect("/admin")
  }
  if (req.isAuthenticated() && req.user.role === 'student') {
    res.redirect("/student")
  }
  else{
    res.render("./index.ejs")
  }
})

app.get("/admin", ensureAuthenticated,isAdmin,(req,res)=>{
  res.render("./admin/admin-index.ejs")
})

app.get("/student", ensureAuthenticated,(req,res)=>{
  res.render("./student.ejs")
})


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
  const testId = req.params.id;
  try {
      // First, delete the test
      const result = await Test.findByIdAndDelete(testId);
      if (!result) {
          return res.status(404).json({ error: 'Test not found.' });
      }

      // Then, remove it from all batches that contain it in the `tests` array
      await Batch.updateMany(
          { tests: testId },
          { $pull: { tests: testId } }
      );

      return res.status(200).json({ message: 'Test deleted successfully!' });
  } catch (error) {
      return res.status(500).json({ error: 'Error deleting test.' });
  }
});




// Admin Route - List all tests
app.get('/admin/tests', async (req, res) => {
  const tests = await Test.find({}); // Fetch all tests from the database
  res.render('./testseries/admin-test', { tests });
});


app.get("/user/complaint",(req,res)=>{
  res.render("./complaints/student-window.ejs")
})

app.get('/batch/:batchId/authorize-students', async (req, res) => {
  try {
      const { batchId } = req.params; // Destructure batchId from req.params
      const students = await User.find(); // Fetch all students
      res.render('authorize-students', { students, batchId }); // Render the EJS template with the students and batchId
  } catch (error) {
      console.error('Error fetching students:', error);
      res.status(500).send('Server Error');
  }
});


// Route to authorize a student
 
app.post('/batch/:batchId/authorize/:studentEmail', async (req, res) => {
  const { batchId,studentEmail } = req.params;
  const userString = JSON.stringify(studentEmail, null, 2);
  const emailMatch = userString.match(/email:\s*'([^']+)'/);
  const email = emailMatch ? emailMatch[1] : null; // Pretty print the user object
  try {
      // Fetch current user document
      const user = await User.find({ email: email });
      // Add batch ID to purchasedBatches
      await User.updateOne(
          { email: email },
          { $addToSet: { purchasedBatches: batchId } }
      );
      req.flash('success_msg', 'Batch authorized successfully!');
      res.redirect(`/batch/${batchId}/authorize-students`);
  } catch (error) {
      console.error('Error authorizing student:', error);
      req.flash('error_msg', 'An error occurred while authorizing the batch.');
      res.status(500).send('Server Error');
  }
});


app.get('/info',ensureAuthenticated, (req, res) => {
  res.render("./users/userDetails.ejs");
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
