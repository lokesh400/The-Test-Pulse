const express = require("express");
const passport = require("passport");
const User = require("../../models/User");
const Batch = require("../../models/Batch")

const router = express.Router()

// Get current logged-in user info
// router.get("/", async (req, res) => {
//   const batches = await Batch.find();
//   res.json(batches);
// });

router.get("/:id", async (req, res) => {
  const batch = await Batch.findById(req.params.id);
  res.json(batch);
});

// Get all batches
router.get('/', async (req, res) => {
  try {
    const batches = await Batch.find().sort({ createdAt: -1 });
    res.json(batches);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get featured batches (for carousel)

// Logout user
router.post("/logout", (req, res) => {
  req.logout(() => {
    res.json({ message: "Logged out successfully" });
  });
});
module.exports = router;
