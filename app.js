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

// ==============================
// 🔹 BASIC CONFIG
// ==============================
const PORT = process.env.PORT || 4000;

// REQUIRED for Render / proxies
app.set("trust proxy", 1);

// ==============================
// 🔹 MODELS
// ==============================
const Test = require("./models/Test");
const User = require("./models/User");
const Batch = require("./models/Batch");
const Team = require("./models/Team");
const Question = require("./models/Question");

// ==============================
// 🔹 DATABASE
// ==============================
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error:", err));

// ==============================
// 🔹 CLOUDINARY
// ==============================
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

// Multer (memory – REQUIRED for Render)
const upload = multer({ storage: multer.memoryStorage() });

// ==============================
// 🔹 MIDDLEWARE
// ==============================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.set("view engine", "ejs");

// ==============================
// 🔹 CORS (SINGLE CONFIG)
// ==============================
app.use(cors({
  origin: true,
  credentials: true,
}));

// ==============================
// 🔹 SESSION STORE
// ==============================
const store = MongoStore.create({
  mongoUrl: process.env.MONGO_URL,
  crypto: { secret: process.env.SESSION_SECRET },
  touchAfter: 24 * 3600,
});

store.on("error", (err) => {
  console.error("❌ Session store error:", err);
});

app.use(
  session({
    store,
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 3 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    },
  })
);

// ==============================
// 🔹 PASSPORT
// ==============================
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(flash());

app.use((req, res, next) => {
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  res.locals.currUser = req.user;
  next();
});

// ==============================
// 🔹 AUTH HELPERS
// ==============================
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return next();
  return res.redirect("/user/login");
}

function isAdmin(req, res, next) {
  if (req.isAuthenticated() && req.user.role === "admin") return next();
  return res.render("error/accessdenied");
}

// ==============================
// 🔹 ROUTES (WEB)
// ==============================
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

// ==============================
// 🔹 MOBILE API ROUTES
// ==============================
app.use("/auth", require("./routes/mobile/auth"));
app.use("/api/batches", require("./routes/mobile/batch"));
app.use("/api/tests", require("./routes/mobile/test"));
app.use("/api", require("./routes/mobile/quesOfTheDay"));

// ==============================
// 🔹 MAIN ROUTES
// ==============================
app.get("/", async (req, res) => {
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

// ==============================
// 🔹 SERVER START
// ==============================
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
