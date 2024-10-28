const express = require("express");
const router = express.Router();
const User = require('../models/User');
const passport = require("passport");
const nodemailer = require('nodemailer');
const Otp = require('../models/Otp');

// Signup route
router.get('/signup', (req, res) => {
    res.render("./users/signup.ejs");
});

router.post('/signup', async (req, res) => {
    const {name,email, password ,confirmpassword,otp} = req.body;
    const role = "student";
    const username = email;
    let user = await Otp.findOne({ email });
    if(password==confirmpassword&&otp==user.otp){
        const newUser = new User({name,role, email, username });
    try {
        // Attempt to register the new user
        const registeredUser = await User.register(newUser, password);
        //sendimg greeting mail

        const transporter = nodemailer.createTransport({
            service:'gmail',
            host:'smtp.gmail.com',
            secure:false,
            port:587,
            auth:{
             user:"lokeshbadgujjar401@gmail.com",
             pass:process.env.mailpass
            }
           });
        
           try{
              const mailOptions = await transporter.sendMail({
                from:"lokeshbadgujjar401@gmail.com",
                to: `${email}`,
                subject: 'Welcome to TheTestPulseFamily',
                text: `Dear ${name} welcome to TheTestPulse Family.`,
            });
        } catch(error){
            transporter.sendMail(mailOptions,(error,info)=>{
                if(error){
                    console.log(error)
                }
                else{
                    console.log(info+response);
                }
            })
        }

        // Redirect to login page after successful registration
        res.redirect('/user/login');
    } catch (error) {
        console.error(error);
        // Render signup page with an error message
        res.render("./users/signup.ejs", {error : error.message});
    }
    }
    else{
        res.render("./users/signup.ejs", {error : "password do not match"});
    } 
});

// Login route
router.get("/login", (req, res) => {
    res.render("./users/login.ejs");
});

router.post("/login",
    passport.authenticate("local", {
        failureRedirect: "/user/login",
    }), 
    async (req, res) => {
        // Successful login redirects to index page
        if(req.user.role==='admin'){
            res.redirect("/admin")
        }
        else{
            res.redirect("/student"); // Redirect to the homepage after successful login
        }
        
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            host: 'smtp.gmail.com',
            secure: false,
            port: 587,
            auth: {
                user: "lokeshbadgujjar401@gmail.com",
                pass: process.env.mailpass
            }
        });
        
        try {
            const info = await transporter.sendMail({
                from: "lokeshbadgujjar401@gmail.com",
                to: `${req.user.email}`,
                subject: 'Recent Login Activity Noticed',
                text: `Dear ${req.user.email}, a recent login has been made from your account on TheTestPulse Platform. If this wasn't you, please change your password.`,
            });
            console.log("Email sent: ", info.response);
        } catch (error) {
            console.error("Error sending email: ", error);
        }
        

    }
);

// Logout route
router.get("/logout", (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        res.redirect("/"); // Redirect to homepage after logout
    });
});

//contactus
router.get("/support", (req, res) => {
    res.render("./users/contactus.ejs");
});



module.exports = router;



