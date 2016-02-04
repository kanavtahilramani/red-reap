'use strict';

var express = require('express');
var controller = require('./reddit.controller');

var router = express.Router();

// router.get('/', controller.index);
router.get('/:username', controller.getUserComments);
router.get('/:username/top', controller.getTopComment);

module.exports = router;