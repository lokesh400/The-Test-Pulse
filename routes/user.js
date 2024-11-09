const express = require("express");
const router = express.Router();
const User = require('../models/User');
const passport = require("passport");
const nodemailer = require('nodemailer');
const passportLocalMongoose = require('passport-local-mongoose');
const Otp = require('../models/Otp');
const forgetOtp = require('../models/forgetOtp');

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
        req.flash('error_msg', error.message);
        res.render("./users/signup.ejs");
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

router.post("/login", async (req, res, next) => {
    // Passport Authentication manually
    passport.authenticate("local", async (err, user, info) => {
        if (err) {
            console.error("Error during authentication:", err);
            req.flash('error_msg', 'Something went wrong. Please try again.');
            return res.redirect("/user/login"); // Redirect back to login if there was an error
        }

        if (!user) {
            req.flash('error_msg', info.message || 'Invalid credentials. Please check your username and password.');
            return res.redirect("/user/login"); // Invalid login credentials
        }

        // If login is successful, log in the user
        req.login(user, async (err) => {
            if (err) {
                console.error("Login failed:", err);
                req.flash('error_msg', 'Login failed. Please try again.');
                return res.redirect("/user/login");
            }

            // Flash a success message and redirect based on user role
            req.flash('success_msg', 'You have successfully logged in!');
            if (user.role === 'admin') {
                res.redirect("/admin"); // Redirect to admin dashboard
            } else {
                res.redirect("/student"); // Redirect to student page
            }

            // Send login email notification
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                host: 'smtp.gmail.com',
                secure: false,
                port: 587,
                auth: {
                    user: "lokeshbadgujjar401@gmail.com",
                    pass: process.env.mailpass, // Securely store the email password in environment variables
                }
            });

            try {
                const info = await transporter.sendMail({
                    from: "lokeshbadgujjar401@gmail.com",
                    to: user.email,
                    subject: 'Recent Login Activity Noticed',
                    text: `Dear ${user.email}, a recent login has been made from your account on TheTestPulse Platform. If this wasn't you, please change your password.`,
                });
                console.log("Email sent: ", info.response);
            } catch (error) {
                console.error("Error sending email: ", error);
            }
        });
    })(req, res, next);
});


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

router.post('/forget/password', async (req, res) => {
    const { otp,newPassword, confirmNewPassword,email } = req.body;
    // Validate new passwords match
    let candidate = await Otp.findOne({ email });
    if(newPassword==confirmNewPassword&&otp==candidate.otp){
    try {
        const student = await User.findOne({email});
        // Update to new password
        await student.setPassword(newPassword);
        await student.save();
        req.flash('success_msg', 'Password Reset Successfully');
        req.flash('error_msg', 'Password Reset Successfully');
        res.render('./users/login.ejs');
    } catch (error) {
        console.error("Error updating password:", error);
        req.flash('error_msg', 'Some error occured');
        res.render('./users/login.ejs');
    }}
});

//contactus
router.get("/support", (req, res) => {
    res.render("./users/contactus.ejs");
});

//User Info
router.get('/info',ensureAuthenticated, (req, res) => {
    res.render("./users/userDetails.ejs");
  });


module.exports = router;



