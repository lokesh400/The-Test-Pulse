const express = require("express");
const router = express.Router();
const passport = require("passport");
const User = require("../models/User");
const Otp = require("../models/Otp");
const nodemailer = require("nodemailer");

// Middleware
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect("/user/login");
}

// ===================== SIGNUP =====================
router.get("/signup", (req, res) => {
  res.render("./users/signup.ejs");
});

router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, confirmpassword, otp, contactNumber } = req.body;

    if (password !== confirmpassword) {
      req.flash("error_msg", "Passwords do not match");
      return res.redirect("/user/signup");
    }

    const otpDoc = await Otp.findOne({ email });
    if (!otpDoc || otpDoc.otp !== otp) {
      req.flash("error_msg", "Invalid OTP");
      return res.redirect("/user/signup");
    }

    const user = new User({
      name,
      email,
      username: email,
      role: "student",
      contactNumber,
    });

    await User.register(user, password);

    req.flash("success_msg", "Account created successfully. Please login.");
    res.redirect("/user/login");
  } catch (err) {
    req.flash("error_msg", err.message);
    res.redirect("/user/signup");
  }
});

// ===================== LOGIN =====================
router.get("/login", (req, res) => {
  res.render("./users/login.ejs");
});

router.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      req.flash("error_msg", "Something went wrong");
      return res.redirect("/user/login");
    }

    if (!user) {
      req.flash("error_msg", info?.message || "Invalid credentials");
      return res.redirect("/user/login");
    }

    req.login(user, err => {
      if (err) {
        req.flash("error_msg", "Login failed");
        return res.redirect("/user/login");
      }

      req.flash("success_msg", "Successfully logged in");
      res.redirect("/");
    });
  })(req, res, next);
});

// ===================== LOGOUT =====================
router.get("/logout", (req, res, next) => {
  req.logout(err => {
    if (err) return next(err);
    req.flash("success_msg", "Logged out successfully");
    res.redirect("/user/login");
  });
});

// ===================== FORGET PASSWORD =====================
router.get("/forget-password", (req, res) => {
  res.render("./users/forgetpassword.ejs");
});

router.post("/forget/password", async (req, res) => {
  const { email, otp, newPassword, confirmNewPassword } = req.body;

  if (newPassword !== confirmNewPassword) {
    req.flash("error_msg", "Passwords do not match");
    return res.redirect("/user/forget-password");
  }

  const otpDoc = await Otp.findOne({ email });
  if (!otpDoc || otpDoc.otp !== otp) {
    req.flash("error_msg", "Invalid OTP");
    return res.redirect("/user/forget-password");
  }

  const user = await User.findOne({ email });
  await user.setPassword(newPassword);
  await user.save();

  req.flash("success_msg", "Password reset successfully");
  res.redirect("/user/login");
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



