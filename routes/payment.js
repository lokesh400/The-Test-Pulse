const express = require("express");
const router = express.Router();
const Batch = require('../models/Batch');
const User = require('../models/User');

const { isLoggedIn, saveRedirectUrl, isAdmin } = require('../middlewares/login');

const Razorpay = require('razorpay');
const crypto = require('crypto');

// Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.rzp_key_id,
  key_secret: process.env.rzp_key_secret,
});

// Check authentication
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return next();
  return res.redirect('/user/login');
}

// Check if user purchased batch
const checkPurchasedBatch = (req, res, next) => {
  const { id } = req.params;

  if (!req.user) {
    return res.status(401).send("Please login first");
  }

  if (req.user.role === 'admin' || req.user.purchasedBatches.includes(id)) {
    return next();
  }

  return res.status(403).send('Access denied: Batch not purchased.');
};

// ======================
// SHOW ALL BATCHES
// ======================
router.get('/showallbatches', ensureAuthenticated, async (req, res) => {
  try {
    const allBatches = await Batch.find({});
    const filteredBatches = allBatches.filter(batch => batch.amount > 0);

    res.render('./batch/showallbatches.ejs', {
      keyId: process.env.rzp_key_id,
      allBatches: filteredBatches,
      email: req.user.email
    });

  } catch (err) {
    console.error("Error fetching batches:", err.message);
    res.status(500).send('Server error');
  }
});

// ======================
// CREATE ORDER
// ======================
router.post('/create-order', ensureAuthenticated, async (req, res) => {
  try {
    const { batchId, email } = req.body;

    const batch = await Batch.findById(batchId);

    if (!batch) {
      return res.status(404).json({ error: 'Batch not found' });
    }

    const options = {
      amount: batch.amount * 100,
      currency: 'INR',
      receipt: `receipt_${Date.now()}`
    };

    const order = await razorpay.orders.create(options);

    res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      batchId,
      email
    });

  } catch (error) {
    console.error("Order creation failed:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to create order"
    });
  }
});

// ======================
// VERIFY PAYMENT
// ======================
router.post('/verify-payment', ensureAuthenticated, async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      batchId,
      email
    } = req.body;

    // Security check: required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: "Incomplete data" });
    }
    const generated_signature = crypto
      .createHmac("sha256", process.env.rzp_key_secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Payment signature mismatch"
      });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    await User.updateOne(
      { email },
      { $addToSet: { purchasedBatches: batchId } }
    );

    return res.status(200).json({
      success: true,
      message: "Payment verified & enrollment successful"
    });

  } catch (error) {
    console.error("Payment verification error:", error.message);
    res.status(500).json({
      success: false,
      message: "Payment verification failed"
    });
  }
});

// ======================
// MOBILE ROUTE PURCHASE
// ======================
router.get('/purchase/explore/user/:id', saveRedirectUrl, isLoggedIn, async (req, res) => {
  if (req.user) {
    req.logout(err => {
      if (err) return next(err);
      return res.redirect(`/purchase/explore/${req.params.id}`);
    });
  } else {
    res.redirect(`/purchase/explore/${req.params.id}`);
  }
});

// ======================
// PURCHASE PAGE ROUTE
// ======================
router.get('/purchase/explore/:id', saveRedirectUrl, isLoggedIn, async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id);

    if (!batch) {
      return res.status(404).send("Batch not found");
    }

    res.render('batch/purchasethisBatch.ejs', {
      batch,
      email: req.user?.email,
      keyId: process.env.rzp_key_id
    });

  } catch (error) {
    console.error("Batch fetch failed:", error.message);
    res.status(500).send("Server error");
  }
});

module.exports = router;
