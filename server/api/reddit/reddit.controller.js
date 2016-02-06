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

function getUserData(req, res) {
    console.log("\n\n===============================\n\n" + "CREATED USER, SAVING" + "\n\n==============================\n\n");
    var userData = new User({username: req.params.username});
    console.log("\n\n===============================\n\n" + "LINE 21" + "\n\n==============================\n\n");
    getTopComment(req, res, function(result) {
      console.log("\n\n===============================\n\n" + "LINE 23" + "\n\n==============================\n\n");
      userData.topComment = result;
      console.log("\n\n===============================\n\n" + "LINE 25" + "\n\n==============================\n\n");

      getKarma(req, res, function(response) {
        userData.karma = response;
        console.log("\n\n===============================\n\n" + "LINE 29" + "\n\n==============================\n\n");

        userData.save(function (err) {
          if (err)
            res.send(err);
          userData.save();
        })
      })
    });
    
    return userData;
}

function getUserData(req, res) {
    console.log("\n\n===============================\n\n" + "CREATED USER, SAVING" + "\n\n==============================\n\n");
    var userData = new User({username: req.params.username});
    console.log("\n\n===============================\n\n" + "LINE 21" + "\n\n==============================\n\n");
      userData.topComment = getTopComment(req, res);
      console.log("\n\n===============================\n\n" + "LINE 25" + "\n\n==============================\n\n");
        userData.karma = getKarma(req, res);
        console.log("\n\n===============================\n\n" + "LINE 29" + "\n\n==============================\n\n");

        userData.save(function (err) {
          if (err)
            res.send(err);
          userData.save();
          console.log("\n\n===============================\n\n" + "RETURNING" + "\n\n==============================\n\n");
          return userData;
        });
}

// function getUserData(req, res) {
//     console.log("\n\n===============================\n\n" + "CREATED USER, SAVING" + "\n\n==============================\n\n");
//     var userData = new User({username: req.params.username});
//     console.log("\n\n===============================\n\n" + "LINE 21" + "\n\n==============================\n\n");
//     getTopComment(req, res).then(function(result) {
//          userData.topComment = result;
//          console.log("\n\n===============================\n\n" + "LINE 23" + "\n\n==============================\n\n");
//          getKarma(req, res).then(function(response) {
//             userData.karma = response;
//             console.log("\n\n===============================\n\n" + "LINE 25" + "\n\n==============================\n\n");
//             userData.save(function (err) {
//             if (err)
//               res.send(err);
//             userData.save();
//             })
//             console.log("\n\n===============================\n\n" + "LINE 29" + "\n\n==============================\n\n");
//             return userData;
//           })
//          });   
// }

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

export function checkUser (req, res) {
  getUser(req.params.username).then(function(userData) {
      if (userData != null) { // add our time constraint
          console.log("\n\n===============================\n\n" + "USER IS NOT NULL, RETURN FROM DB" + "\n\n==============================\n\n");
          return res.send(userData);
      }

      else {
        getUserData(req, res, (function(user) {
          console.log("\n\n===============================\n\n" + "SENDING" + "\n\n==============================\n\n");
          return res.send(user);
        }));
      }
  });
}

export function getUserComments (req, res) {
  // console.log("===========================\n\n" + r + "\n\n==============================");
  reddit('/user/' + req.params.username + '/comments/').get().then(function(result) {
      return res.send(JSON.stringify(result, null, 4));
  });
}

export function getTopComment (req, res) {
      reddit('/user/' + req.params.username + '/comments/').get({
        limit: 1,
        sort: 'top'
      }).then(function(response) {
          return response.data.children[0].data.body;
      });
}

export function getKarma (req, res) {
  reddit('/user/' + req.params.username + '/about/').get().then(function(response) {
    return response.data.comment_karma;
  });
}