const express = require("express");
require('dotenv').config;
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const path = require("path");



const dataModule = require('./public/js/data.js');
// const currentaffair = require('./models/currentaffair')
const DataModel = require('./models/Data'); // Adjust the path if necessary
const Blog = require('./models/Blog');
const Job = require('./models/Job');
const Test = require('./models/Test');

const User = require('./models/User');

const Subject = require('./models/Subject');
const Chapter = require('./models/Chapter');
const Topic = require('./models/Topic');
const Question = require('./models/Question');

const app = express();
const port = 8000;


const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const upload = multer({ dest: 'uploads/' });
const fs = require('fs');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.Cloud_Same, 
    api_key: process.env.Api_Sey, 
    api_secret: process.env.Api_Secret
});


// Connect to MongoDB
mongoose.connect( "mongodb+srv://lokeshbadgujjar401:GefjBryDHuCWq7fk@cluster0.siebv.mongodb.net/");

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');

// app.use(fileUpload())
// app.use(express.json());

const { ObjectId } = mongoose.Types; 
// Routes

app.get('/', (req, res) => {
  res.render('index');
});

app.get('/login' ,(req,res)=>{
  res.render('listings/login')
})

app.post('/signup' , async (req,res)=>{
  const {Email,Name,Password} = req.body;
  const existingUser = await User.findOne({Email});
  if(existingUser){
    res.send("User Already Exits")
  }
  else {

    const newUser = new User({ 
      Name:Name,
      Email:Email,
      Password:Password
  });
  await newUser.save();
    res.send("Signup Confirmed");
  }
  // res.render('listings/login')
})

// app.get('/currentaffairs', async (req, res) => {

//     const allListing = await currentaffair.find({});
//     res.render('currentaffair',{allListing});

// });



app.get("/listings/:id" , async (req, res) => {

  let {id} = req.params;
  const allListing = await currentaffair.findById(id);
  res.render("listings/show.ejs",{allListing})

})

app.get('/blogs/new', (req,res) => {
  res.render('listings/blogs/createblogs');
});

app.post('/blogs/new', async (req, res) => {
  const { date,title,event } = req.body;
        const title2 = title.toString();
        const event2 = event.toString();
        const newBlog = new Blog({ 
          date:date,
          title:title2,
          event:event2
      });
      await newBlog.save();
      res.send("Data Saved");
});

app.get('/blogs/show', async (req, res) => {
  const allBlogs = await Blog.find({});
  res.render('./listings/blogs/showallblogs',{allBlogs});
});

app.get('/blogs/show/all/:id', async (req, res) => {
  const {id} = req.params;
  const allBlogs = await Blog.findById(id);
  res.render("./listings/blogs/showblog.ejs",{allBlogs});
});



      

// app.post("/listings", async (req,res) => {
   
//     let sampleListing = new currentaffair({
//                  Info:current,
//              });

//          await sampleListing.save();
//          console.log(current);
//     let current = [];
//     console.log(current)
    
//           res.redirect("/listings/create");
//           res.send("done");
// })

// app.get('/testpulse/apply', (req, res) => {
//   res.render('index');
// });

// app.post('/submit', async (req, res) => {
//   const role = req.body.role;
//   const {name,mail,number,college} = req.body

//   try {
//     const newRole = new Role({ 
//         Role : role,
//         Name : name,
//         Number : number,
//         Email : mail,
//         College: college,
//     });
//     await newRole.save();
//     res.render('success', { role });
//   } catch (error) {
//     res.status(500).send('Error saving data');
//   }
// });

// app.get('/users', async (req, res) => {
//       const roles = await Role.find({});
//       res.render('userdata', { roles });
//   });

  // TEST PORTAL

// app.get('/testportal', async (req, res) => {
//       const chnames = await Chapter.find({});
//       res.render('testportal', { chnames });
  // const {name} = req.body;
  // const {name,mail,number,college} = req.body

  // try {
  //   const newRole = new Role({ 
  //       Role : role,
  //       Name : name,
  //       Number : number,
  //       Email : mail,
  //       College: college,
  //   });
  //   await newRole.save();
  //   res.render('success', { role });
  // } catch (error) {
  //   res.status(500).send('Error saving data');
  // }
  // res.render('testportal');
// });  

// app.post('/testportal/:ch', (req,res)=>{
//   const {ch} = req.params;
//   console.log(ch);
//   res.send("done");
// })











 // Adjust the path if necessary





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




// JOB ROUTES

app.get('/jobs/newopenings', async (req, res) => {
  res.render('./listings/job/new');
});

app.post('/job/new', async (req, res) => {
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


app.get('/jobs/allopenings', async (req, res) => {
  const JobData = await Job.find({});
  res.render('./listings/job/all',{JobData});
});



// TEST SERIES


app.get('/testportal', (req, res) => {
  res.render('./testseries/indexx.ejs');
});

// Admin Route - Render test creation page
app.get('/admin/create', (req, res) => {
  res.render('./testseries/createtest.ejs');
});

// Handle form submission for creating a test
app.post('/admin/create', async (req, res) => {
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


// Student Route - Render test attempt page
app.get('/student/tests', async (req, res) => {
  const tests = await Test.find(); // Fetch all tests from the database
  res.render('./testseries/student-tests.ejs', { tests });
});

app.get('/student/test/:id', async (req, res) => {
  const test = await Test.findById(req.params.id);
  res.render('./testseries/attempt-test.ejs', { test });
});

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








app.get('/tests', async (req, res) => {
  res.render('./testseries/TestFromQuestionBank.ejs');
});

app.get('/api/subjects', async (req,res) => {
  const subjects = await Subject.find({})
  res.json(subjects);
})

app.get('/api/chapters/:name', async (req,res) => {
  const {name} = req.params;
  const chapter = await Chapter.find({SubjectName : name})
  res.json(chapter);
})

app.get('/api/topics/:name', async (req,res) => {
  const {name} = req.params;
  const chapter = await Topic.find({ChapterName : name})
  res.json(chapter);
})

app.get('/api/questions/:name', async (req,res) => {
  const {name} = req.params;
  const chapter = await Question.find({TopicName : name})
  res.json(chapter);
})


app.post('/process', async (req, res) => {
  const selectedOptions = req.body.options; // options will be an array
  let data =[];
  
  for(let i=0;i<selectedOptions.length;i++){
     let ques = await Question.findById(selectedOptions[i]); 
     let data2 = data.push(ques)
  }
   res.render('./testseries/TestFromQuestionBank2.ejs',{data});
});


// QUESTION BANK

app.get('/create/question/bank', async(req,res) =>{
  res.render('./questionbank/createques.ejs')
})

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

// Define the route
app.post('/create-ques', upload.single("file"), async (req, res) => {
   try {
    const {subject,chapter,topic,correct} = req.body;
    const result = await Upload.uploadFile(req.file.path);
    const imageUrl = result.secure_url
    fs.unlink(req.file.path, (err) => {
      if (err) {
        console.error('Error deleting local file:', err);
      } else {
        console.log('Local file deleted successfully');
      }
    });
    const newQuestion = new Question({ 
      SubjectName : subject,
      ChapterName : chapter,
      TopicName: topic,
      Question : imageUrl,
      Option1 : "Option 1",
      Option2 : "Option 2",
      Option3 : "Option 3",
      Option4: "Option 4",
      CorrectOption:correct
    });
    await newQuestion.save();

    console.log(imageUrl)
    console.log(subject)
    res.json(result); // Send the upload result as a response
  } catch (error) {
    console.error(error);
    res.status(500).send('Upload failed.');
  }
});

app.get('/create/information', (req,res) => {
  res.render('./questionbank/createinfo.ejs')
})

app.post('/create/subject', async(req,res) => {
  let {subject} = req.body;
  const newsubject = new Subject({ 
                          Name: subject
                         });
   await newsubject.save();
})

app.post('/create/chapter', async(req,res) => {
  let {subject,chapter} = req.body;
  const newsubject = new Chapter({ 
                          SubjectName:subject,
                          ChapterName:chapter
                         });
   await newsubject.save();
})

app.post('/create/topic', async(req,res) => {
  let {subject,chapter,topic} = req.body;
  const newsubject = new Topic({ 
                          SubjectName:subject,
                          ChapterName:chapter,
                          TopicName:topic
                         });
   await newsubject.save();
})
























// server.js
const OpenAI = require('openai'); // Updated import for v4.x
require('dotenv').config();


// Middleware to parse JSON
app.use(express.json());

// Initialize OpenAI API with your key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Endpoint to handle ChatGPT API requests
app.post('/chat', async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'No message provided' });
  }

  console.log('Received message:', message); // Log the incoming message

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: message }],
    });

    const chatResponse = response.choices[0].message.content;
    console.log('ChatGPT response:', chatResponse); // Log the ChatGPT response

    res.json({ response: chatResponse });
  } catch (error) {
    console.error('Error with OpenAI API:', error);
    res.status(500).json({ error: 'Error generating response' });
  }
});


app.get('/ai', async (req, res) => {
  res.render('apenai.ejs');
});




// Start server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
