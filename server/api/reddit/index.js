'use strict';

var express = require('express');
var controller = require('./reddit.controller');
// import passport from 'passport';
// import Strategy from 'passport-http'.DigestStrategy;

// passport.use(new Strategy({ qop: 'auth' },
//   function(username, cb) {
//     db.users.findByUsername(username, function(err, user) {
//       if (err) { return cb(err); }
//       if (!user) { return cb(null, false); }
//       return cb(null, user, user.password);
//     })
//   }));

var router = express.Router();

// router.get('/', controller.index);
router.get('/:username', controller.checkUser);
router.get('/:username/top', controller.getTopComment);
router.get('/:username/karma', controller.getKarma);

module.exports = router;