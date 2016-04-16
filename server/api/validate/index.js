'use strict';

var express = require('express');
var controller = require('./validate.controller');

var router = express.Router();

router.get('/', controller.startAuth);
// router.get('/me', controller.myUser);
router.get('/redirect', controller.storeAcct);
router.get('/refresh', controller.getRefreshToken);

module.exports = router;