// module.exports.isLoggedIn = (req, res, next) => {
//     if (!req.isAuthenticated()) {
//         req.session.redirectUrl = req.originalUrl;
//         return res.redirect("/user/login");
//     }
//     next();
// };

module.exports.saveRedirectUrl = (req, res, next) => {
    if (req.session.redirectUrl) {
        res.locals.RedirectUrl = req.session.redirectUrl;
    }
    next();
};

module.exports.isLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.session.redirectUrl = req.originalUrl;
    return res.redirect("/user/login");
  }
  next();
};



// module.exports.saveRedirectUrl = (req, res, next) => {
//      if (!req.isAuthenticated()) {
//          req.session.redirectUrl = req.originalUrl;
//          return res.redirect("/user/login");
//   }
//   next();
// };

module.exports.ensureAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    req.flash('error_msg', 'Please log in to continue.');
    res.redirect('/user/login');
};

module.exports.isAdmin = (req, res, next) => {
    if (req.isAuthenticated() && req.user.role === "admin") {
        return next();
    }

    // Send an error response with a 403 (Forbidden) status code
    res.status(403).json({
        success: false,
        error: {
            code: 403,
            message: "Access denied: Admins only.",
        },
    });
};

module.exports.hasAddress = (req, res, next) => {
    if (req.isAuthenticated() && req.user) {
        const { address, mobile } = req.user;
        const isAddressValid =
            address &&
            address.street &&
            address.city &&
            address.state &&
            address.pincode;
        const hasMobile = !!mobile;
        if (isAddressValid && hasMobile) {
            return next();
        }
    }
    return res.redirect('/add-address');
};

