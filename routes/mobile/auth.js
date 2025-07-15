const express = require("express");
const passport = require("passport");
const User = require("../../models/User");

const router = express.Router()

router.post("/register", async (req, res) => {
  console.log("signup hitted")
  const { username, password } = req.body;
  const email = username;
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password required" });
  }
  try {
    const user = new User({ email,username, role:"student" });
    await User.register(user, password); // passport-local-mongoose method
    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "Registration failed" });
  }
});

// Login user
router.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    
    if (err) return next(err);
    
    if (!user) {
      return res.status(401).json({ error: "Invalid username or password" });
    }
    req.logIn(user, (err) => {
      if (err) return next(err);
      // Send back user info without sensitive fields
      res.json({ username: user.username, role: user.role });
    });
  })(req, res, next);
});

// Get current logged-in user info
router.get("/me", (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
    console.log("Auth Check Route Hitted")
  }
  res.json({ username: req.user.username, role: req.user.role });
});

// Logout user
router.post("/logout", (req, res) => {
  req.logout(() => {
    res.json({ message: "Logged out successfully" });
  });
});
module.exports = router;
