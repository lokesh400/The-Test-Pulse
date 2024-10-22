const express = require("express");
const router = express.Router();
const User = require('../models/User');
const passport = require("passport");

// Signup route
router.get('/signup', (req, res) => {
    res.render("./users/signup.ejs");
    console.log(req.user)
});

router.post('/signup', async (req, res) => {
    const { username, email, password ,confirmpassword} = req.body;
    
    if(password==confirmpassword){
        const newUser = new User({ email, username });
    try {
        // Attempt to register the new user
        const registeredUser = await User.register(newUser, password);
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
    (req, res) => {
        // Successful login redirects to index page
        res.redirect("/"); // Redirect to the homepage after successful login
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

module.exports = router;
