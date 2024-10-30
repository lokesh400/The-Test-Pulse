const express = require("express");
const router =  express.Router();
const Batch = require('../models/Batch');
const User = require('../models/User');

const Razorpay = require('razorpay');
const crypto = require('crypto');

const razorpay = new Razorpay({
  key_id: process.env.rzp_key_id,
  key_secret: process.env.rzp_key_secret,
})

  function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    res.redirect('/user/login');
  }


  function isAdmin(req, res, next) {
    if (req.isAuthenticated() && req.user.role === 'admin') {
      return next();
    }
    res.render("./error/accessdenied.ejs");
  }

  const checkPurchasedBatch = (req, res, next) => {
    const { id } = req.params;
    if (req.user.purchasedBatches.includes(id)|| req.user.role === 'admin') {
        return next();
    } else {
        return res.status(403).send('Access denied: You have not purchased this batch.');
    }
};

//Route to show all batches
router.get('/showallbatches',ensureAuthenticated, async (req, res) => {
    const allBatches = await Batch.find({}); // Fetch available batches from database
    const email = req.user.email; 
    res.render('./batch/showallbatches.ejs', { keyId: process.env.rzp_key_id, allBatches ,email});
  });  

  // Create Razorpay order on server-side
router.post('/create-order', ensureAuthenticated, async (req, res) => {
    const { batchId, email } = req.body;
  
    // Fetch the selected batch from the database
    const batch = await Batch.findById(batchId);
    
    // Check if the batch exists
    if (!batch) {
        return res.status(404).json({ error: 'Batch not found' });
    }
  
    const options = {
        amount: batch.amount * 100, // Convert amount to paise (e.g., 500 INR = 50000 paise)
        currency: 'INR',
        receipt: `receipt_${Math.floor(Math.random() * 1000000)}`,
    };
  
    try {
        const order = await razorpay.orders.create(options);
        res.json({ orderId: order.id, amount: order.amount, batchId, email });
    } catch (error) {
        console.error('Error creating Razorpay order:', error);
        res.status(500).send(error);
    }
  });

// Verify payment and enroll student in batch
router.post('/verify-payment', ensureAuthenticated, async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, batchId, email } = req.body;

    // Verify the payment signature
    const generated_signature = crypto.createHmac('sha256',process.env.rzp_key_secret )
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

    const isValidPayment = generated_signature === razorpay_signature;

    if (isValidPayment) {
        try {
            // Find the student by email or however you identify them in your system
            const user = await User.find({ email: email });
            // Check if the student exists
            if (!user) {
                return res.status(404).json({ success: false, message: "Student not found" });
            }
            // Enroll student in the batch (database logic here)
            await User.updateOne(
              { email: email },
              { $addToSet: { purchasedBatches: batchId } }
          );
            res.status(200).json({ success: true, message: "Enrollment successful" });
        } catch (error) {
            console.error("Error enrolling student:", error);
            res.status(500).json({ success: false, message: "Enrollment failed, please try again later." });
        }
    } else {
        res.status(400).json({ success: false, message: "Invalid payment signature" });
    }
});  


module.exports = router;
