const express = require("express");
const router = express.Router();
const User = require('../models/User');
const passport = require("passport");
const nodemailer = require('nodemailer');
const passportLocalMongoose = require('passport-local-mongoose');
const Otp = require('../models/Otp');

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    res.redirect('/user/login');
  }

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
    const error = req.flash("error");
    req.flash('success_msg', 'Welcome back!');
    res.render("./users/login.ejs",{ error });

});

router.post("/login",
    passport.authenticate("local", {
        failureRedirect: "/user/login",
        failureFlash: true, // Enable flash messages for failures
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

// Forget Password Route

router.get("/forget-password", (req, res, next) => {
    res.render("./users/forgetpassword.ejs")
});

router.post('/forget-password', async (req, res) => {
    const { otp,newPassword, confirmNewPassword,email } = req.body;
    // Validate new passwords match
    console.log(otp,newPassword,email,confirmNewPassword);
    let user = await Otp.findOne({ email });
    if(newPassword==confirmNewPassword&&otp==user.otp){
    try {
        const student = await User.findOne({email});
        // Update to new password
        await student.setPassword(newPassword);
        await student.save();
        req.flash('success_msg', 'Password Updated');
        res.render('./users/login.ejs');

    } catch (error) {
        console.error("Error updating password:", error);
        res.render('./users/login.ejs', { error: "An error occurred, please try again" });
    }}
});

module.exports = router;


//contactus
router.get("/support", (req, res) => {
    res.render("./users/contactus.ejs");
});

//User Info
router.get('/info',ensureAuthenticated, (req, res) => {
    res.render("./users/userDetails.ejs");
  });


module.exports = router;



