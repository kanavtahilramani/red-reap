'use strict';

// import Reddit from './reddit.model';
import creds from '../../config/local.env';
import Token from '../validate/validate.model';
import User from '../user/user.model';
import Snoocore from 'snoocore';

var reddit = new Snoocore({
    userAgent: 'web:red-reap:0.0.1 by (/u/ferristic)',
    throttle: 0,
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

function getRefresh() {
  return Token.findOne();
}

function findUser(username) {
  return User.findOne({ 'username': username});
}

function saveUser(user) {
  user.save(function (err) {
    if (err)
      console.log(err);
  });
}

function createUser(req, res, callback) {
    var userData = new User({username: req.params.username});
    var userComments = [];
    // var monthNames = ["January", "February", "March", "April", "May", "June",
                      // "July", "August", "September", "October", "November", "December"];
    var date, currentMonth, currentYear, currentHour;
    var currentCommentScore = 0,
        currentPostCount = 0;
    var hourTracker = new Array(24+1).join('0').split('').map(parseFloat); //24-wide array of 0s
    var hourScorer = new Array(24+1).join('0').split('').map(parseFloat); //24-wide array of 0s

     getUserComments(req, res, function(allComments) { /* get all user comments */
        date = new Date(allComments[0].data.children[0].data.created_utc * 1000); /* add bounds checking */
        currentMonth = date.getMonth();
        currentYear = date.getFullYear();

        allComments.forEach(function(commentSlice) {
          commentSlice.data.children.forEach(function(currentComment) {
            // userComments.push({
            //                     score: currentComment.data.score,
            //                     nsfw: currentComment.data.over_18,
            //                     body: currentComment.data.body,
            //                     edited: currentComment.data.edited,
            //                     subreddit: currentComment.data.subreddit,
            //                     created: currentComment.data.created_utc,
            //                     upvotes: currentComment.data.ups
            //                   });
              date = new Date(currentComment.data.created_utc * 1000);
              if (date.getMonth() == currentMonth && date.getFullYear() == currentYear) {
                  currentCommentScore += currentComment.data.score;
                  currentPostCount++;
              }
              else {
                userData.data.push({
                                    month: currentMonth,
                                    year: currentYear,
                                    commentKarmaForMonth: currentCommentScore,
                                    postsForMonth: currentPostCount
                                  });
                currentMonth = date.getMonth();
                currentYear = date.getFullYear();
                currentCommentScore = 0;
                currentPostCount = 0;
              }

              currentHour = date.getHours(); //get UTC hour comment was posted
              hourTracker[currentHour]++; //increment count for that hour
              hourScorer[currentHour] += currentComment.data.score; //add comment's score to running total for hour
          });
        });

        for (var i = 0; i < hourTracker.length; i++) //store comment hourly data
        {
          userData.hour.push({
            hour: i,
            postsForHour: hourTracker[i],
            commentKarmaForHour: hourScorer[i]
          });
        }

        getKarmaAndDate(req, res, function(scores) { /* get total karma scores and creation timestamp */
          userData.karma.totalCommentScore = scores.comments;
          userData.karma.totalLinkScore = scores.submissions;
          userData.creationTime = (scores.created)*1000;

          callback(userData);
        });
      });

    // getTopComment(req, res, function(comment) {
    //   userData.topComment.body = comment.body;
    //   userData.topComment.score = comment.score;
    //   userData.topComment.subreddit = comment.subreddit;

        // getTopSubmission(req, res, function(submission) {
        //   userData.topSubmission.score = submission.score;
        //   userData.topSubmission.subreddit = submission.subreddit;
        //   userData.topSubmission.title = submission.title;
        //   userData.topSubmission.permalink = submission.permalink;          
      //     }); 
      //   });
      // });
    // }); 
}

// '/api/reddit/:username/'
export function checkUser (req, res) {
  findUser(req.params.username).then(function(userData) {
      if (userData != null) { // add our time constraint
          return res.send(userData);
      }

      else {
        createUser(req, res, function(user) {
          console.log("\n\nSaving.\n\n");
          saveUser(user);
          return res.send(user);
        });
      }
  });
}

export function getKarmaAndDate (req, res, callback) {
  reddit('/user/' + req.params.username + '/about/').get().then(function(response) {
    var details = {};
    details.comments = parseInt(response.data.comment_karma);
    details.submissions = parseInt(response.data.link_karma);
    details.created = parseInt(response.data.created_utc);
    callback(details);
  });
}

export function getUserComments (req, res, callback) {
  function loop(slice, prevComment) {
    if (slice.data.children.length < 100 || i >= 10) {
      callback(slices);
      // return res.send(slices);
      return;
    }

    i++;

    reddit('/user/' + username + '/comments/').get({ limit: 100, after: prevComment }).then(function(currentSlice) {
      if (currentSlice.data.children.length == 0) {
        return;
      }
      slices.push(slice);
      loop(currentSlice, currentSlice.data.children[currentSlice.data.children.length-1].data.name);
    });
  }

  var slices = [];
  var username = req.params.username;
  var i = 1;

  reddit('/user/' + username + '/comments/').get({ limit: 100 }).then(function(firstSlice) {
    if (firstSlice.data.children.length == 0) {
      return;
    }
    slices.push(firstSlice);
    loop(firstSlice, firstSlice.data.children[firstSlice.data.children.length-1].data.name);
  });  
}

/* ===============================NOT USED================================= */
/* ======================================================================== */

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
        // return res.send(response);
      });
}

export function getTopSubmission (req, res, callback) {
    reddit('/user/' + req.params.username + '/submitted/').get({ /* need to add raw json later */
        limit: 1,
        sort: 'top'
    }).then(function(response) {
        var submission = {};
        submission.score = response.data.children[0].data.score;
        submission.subreddit = response.data.children[0].data.subreddit;
        submission.title = response.data.children[0].data.title;
        submission.permalink = 'https://www.reddit.com' + response.data.children[0].data.permalink;
        callback(submission);
        // return res.send(response);
      });
}

export function aboutUser (req, res) {
  var username = req.params.username;
  // reddit('/user/' + username + '/about/').get().then(res.send);
  reddit('/user/' + req.params.username + '/about/').get().then(function(response) {
    return res.send(response);
  });
}

export function getSubredditInfo (req, res) {
  reddit('/r/' + req.params.subreddit + '/hot').listing().then(function(data) {
    return res.send(data);
  });
}

export function getSubmissionComments (req, res) {
  reddit('/r/AskReddit/comments/463u73').get().then(function(data) {
    return res.send(data);
  });
}