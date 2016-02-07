'use strict';

// import Reddit from './reddit.model';
import creds from '../../config/local.env';
import Token from '../validate/validate.model';
import User from '../user/user.model';
import Snoocore from 'snoocore';

function getRefresh() {
  return Token.findOne();
}

function getUser(username) {
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

function getUserData(req, res) {
    var userData = new User({username: req.params.username});

    getTopComment(req, res, function(comment) {
      userData.topComment.body = comment;
      getKarma(req, res, function(score) {
        userData.karma = score;
        saveUser(userData);
        res.send(userData);
      });
    });
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
  getUser(req.params.username).then(function(userData) {
      if (userData != null) { // add our time constraint
          console.log("\n\n===============================\n\n" + "USER IS NOT NULL, RETURN FROM DB" + "\n\n==============================\n\n");
          return res.send(userData);
      }

      else {
        getUserData(req, res, saveUser);
      }
  });
}
 
export function getUserComments (req, res) {
  // console.log("===========================\n\n" + r + "\n\n==============================");
  reddit('/user/' + req.params.username + '/comments/').get().then(function(result) {
      return res.send(JSON.stringify(result, null, 4));
  });
}

export function getTopComment (req, res, callback) {
      reddit('/user/' + req.params.username + '/comments/').get({
        limit: 1,
        sort: 'top'
      }).then(function(response) {
        callback(response.data.children[0].data.body.toString());
      });
}

export function getKarma (req, res, callback) {
  reddit('/user/' + req.params.username + '/about/').get().then(function(response) {
    callback(parseInt(response.data.comment_karma));
  });
}