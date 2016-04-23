'use strict';

var express = require('express');
var controller = require('./reddit.controller');

var router = express.Router();

router.get('/:username', controller.checkUser);
router.get('/:username/topComment', controller.getTopComment);
router.get('/:username/topSubmission', controller.getTopSubmission);
router.get('/:username/karma', controller.getKarmaAndDate);
router.get('/:username/allComments', controller.getUserComments);
router.get('/:username/allSubmissions', controller.getUserSubmitted);
router.get('/:username/about', controller.getAbout);
router.get('/subreddit/:subreddit', controller.checkSubreddit);
router.get('/progress', controller.getProgress);
router.get('/hottest/:subreddit', controller.getSubmissionComments);
// router.get('/testing', controller.getSubmissionComments);

module.exports = router;