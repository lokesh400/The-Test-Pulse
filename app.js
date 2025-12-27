const express = require("express");
require("dotenv").config();
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const cors = require("cors");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const PORT = process.env.PORT || 4000;
const Test = require("./models/Test");
const User = require("./models/User");
const Batch = require("./models/Batch");
const Team = require("./models/Team");
const Question = require("./models/Question");

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error:", err));

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

const upload = multer({ storage: multer.memoryStorage() });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.set("view engine", "ejs");

app.use(cors({
  origin: true,
  credentials: true,
}));

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URL,
      ttl: 60 * 60 * 24 * 7
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7
    }
  })
);

/* ---------------- PASSPORT ---------------- */
app.use(passport.initialize());
app.use(passport.session());

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
app.use(flash());

app.use((req, res, next) => {
  res.locals.currUser = req.user || null;
   res.locals.success_msg = req.flash("success_msg");
   res.locals.error_msg = req.flash("error_msg");
  res.locals.isAuthenticated = req.isAuthenticated();
  next();
});

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return next();
  return res.redirect("/user/login");
}

function isAdmin(req, res, next) {
  if (req.isAuthenticated() && req.user.role === "admin") return next();
  return res.render("error/accessdenied");
}

app.use("/blogs", require("./routes/blogs"));
app.use("/user", require("./routes/user"));
app.use("/user", require("./routes/otp"));
app.use("/test", require("./routes/testseries"));
app.use("/", require("./routes/questionbank"));
app.use("/", require("./routes/batch"));
app.use("/", require("./routes/studenttest"));
app.use("/", require("./routes/payment"));
app.use("/", require("./routes/membersandstudents"));
app.use("/", require("./routes/admin"));
app.use("/", require("./routes/testpdf"));
app.use("/", require("./routes/resource"));


app.use("/auth", require("./routes/mobile/auth"));
app.use("/api/batches", require("./routes/mobile/batch"));
app.use("/api/tests", require("./routes/mobile/test"));
app.use("/api", require("./routes/mobile/quesOfTheDay"));

// app.get("/", async (req, res) => {
//   if (req.isAuthenticated() && req.user.role === "admin") {
//     return res.redirect("/admin");
//   }
//   if (req.isAuthenticated() && req.user.role === "student") {
//     return res.redirect("/student");
//   }
//   const members = await Team.find();
//   res.render("index", { members });
// });

app.get("/", async (req, res) => {
  if (req.session.justLoggedIn) {
    delete req.session.justLoggedIn;
    const redirectUrl = req.session.redirectUrl || "/";
    delete req.session.redirectUrl;
    return res.redirect(redirectUrl);
  }

  if (req.isAuthenticated() && req.user.role === "admin") {
    return res.redirect("/admin");
  }

  if (req.isAuthenticated() && req.user.role === "student") {
    return res.redirect("/student");
  }

  const members = await Team.find();
  res.render("index", { members });
});


// SAFE API USER ROUTE
app.get("/api/user", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  const user = await User.findById(req.user._id);
  res.json(user);
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
