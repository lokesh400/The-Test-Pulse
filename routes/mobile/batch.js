const express = require("express");
const passport = require("passport");
const User = require("../../models/User");
const Batch = require("../../models/Batch")
const Resource = require("../../models/Resource")

const router = express.Router()


router.get("/:id/resource", async (req, res) => {
  try {
  const resources = await Resource.find({batchId:req.params.id});
  res.json(resources);
  } catch (error){
    console.log(error)
  }
});

router.get('/find/trending', async (req, res) => {
  try {
    const featured = await Batch.find().sort({ createdAt: -1 }).limit(10);
    res.json(featured);
  } catch (err) {
    console.error("Error fetching trending batches:", err);
    res.status(500).json({ message: err.message });
  }
});


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

// to show purchased batches
router.get('/my/purchased', async (req, res) => {
  try{
    var batches = [];
  for (let i = 0; i < req.user.purchasedBatches.length; i++) {
    const batch = await Batch.findById(req.user.purchasedBatches[i]);
    if (!batch) {
      console.log("no batch")
      res.status(201).json({message:"Not Subscribed to any batches"}) // Push the found batch into the array
    }
        batches.push(batch); // Push the found batch into the array
  }
    console.log(batches)
   res.json(batches)
  }catch(error){
    console.log(error)
  }
  
 });

module.exports = router;
