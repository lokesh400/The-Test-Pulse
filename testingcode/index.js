const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");

var flash = require("connect-flash");


// const cookieParser = require("cookie-parser");
const session = require("express-session");


const app = express();
const port = 8000;
// app.use(cookieParser("secretcode"));
const sessionOptions = {
    secret: "bjhbsjhbjhbfdj",
    resave:false,
    saveUninitialized:true
}
app.use(session(sessionOptions));
app.use(flash());

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');

// app.use(express.json());


 
app.get('/', (req, res) => {
    let x = req.session.count++ || 0
    res.send(`you send a request ${x} times`)
});

app.get('/', (req, res) => {
    let x = req.session.count++ || 0
    res.send(`you send a request ${x} times`)
});

 

// Start server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
