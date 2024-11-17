const express = require("express");
const router =  express.Router();
const User = require('../models/User');


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

  
  //ADMIN ROUTE TO ALL USERS
router.get('/admin/allusers',async (req, res) => {
      const users = await User.find({})
      res.render('./admin/all-users.ejs',{users});
  });



module.exports = router;
