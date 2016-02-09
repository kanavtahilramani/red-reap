'use strict';

// import Reddit from './reddit.model';
import creds from '../../config/local.env';
import Token from '../validate/validate.model';
import User from '../user/user.model';
import Snoocore from 'snoocore';

function getRefresh() {
  return Token.findOne();
}

function findUser(username) {
  // console.log("\n\n===============================\n\n" + User.findOne({ 'username': username}) + "\n\n==============================\n\n");
  return User.findOne({ 'username': username});
}

function saveUser(user) {
  user.save(function (err) {
    if (err)
      console.log(err);

    user.save();
  });
}

function createUser(req, res) {
    var userData = new User({username: req.params.username});

    getTopComment(req, res, function(comment) {
      userData.topComment.body = comment.body;
      userData.topComment.score = comment.score;
      userData.topComment.subreddit = comment.subreddit;

      getKarmaAndDate(req, res, function(scores) {
        userData.commentKarma = scores.comments;
        userData.linkKarma = scores.submissions;
        userData.creationDate = scores.created;

        getTopSubmission(req, res, function(submission) {
          userData.topSubmission.score = submission.score;
          userData.topSubmission.subreddit = submission.subreddit;
          userData.topSubmission.title = submission.title;
          userData.topSubmission.permalink = submission.permalink;


          saveUser(userData);
          res.send(userData);         
        });
      });
    });
}

function updateUser(req, res) {

}

var reddit = new Snoocore({
    userAgent: 'web:red-reap:0.0.1 by (/u/ferristic)',
    oauth: {
        type: 'explicit',
        duration: 'permanent',
        key: creds.client_id,
        secret: creds.redsecret,
        redirectUri: 'http://localhost:9000/api/validate/redirect',
        scope: [ 'identity', 'read', 'history', 'flair' ]
    }
  });

  getRefresh().then(function(data) {
    reddit.setRefreshToken(data.refresh.toString());
  });

// '/api/reddit/:username/'
export function checkUser (req, res) {
  findUser(req.params.username).then(function(userData) {
      if (userData != null) { // add our time constraint
          return res.send(userData);
      }

      else {
        createUser(req, res);
      }
  });
}
 
export function getUserComments (req, res) {
  reddit('/user/' + req.params.username + '/comments/').get().then(function(result) {
      return res.send(JSON.stringify(result, null, 4));
  });
}

export function getTopComment (req, res, callback) {
      reddit('/user/' + req.params.username + '/comments/').get({
        limit: 1,
        sort: 'top'
      }).then(function(response) {
        var comment = {};
        comment.score = parseInt(response.data.children[0].data.score);
        comment.body = response.data.children[0].data.body.toString();
        comment.subreddit = response.data.children[0].data.subreddit.toString();
        callback(comment);
      });
}

export function getTopSubmission (req, res, callback) {
    reddit('/user/' + req.params.username + '/submitted/').get({
        limit: 1,
        sort: 'top'
    }).then(function(response) {
        var submission = {};
        submission.score = response.data.children[0].data.score;
        submission.subreddit = response.data.children[0].data.subreddit;
        submission.title = response.data.children[0].data.title;
        submission.permalink = 'https://www.reddit.com' + response.data.children[0].data.permalink;
        callback(submission);
      });
}

export function getNSFWComments (req, res, callback) {
    
}

export function getNSFWSubmissions (req, res, callback) {
    
}

export function getKarmaAndDate (req, res, callback) {
  reddit('/user/' + req.params.username + '/about/').get().then(function(response) {
    var details = {};
    details.comments = parseInt(response.data.comment_karma);
    details.submissions = parseInt(response.data.link_karma);
    details.created = parseInt(response.data.created_utc);
    callback(details);
    // return res.send(response);
  });
}