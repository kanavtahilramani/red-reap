'use strict';

// import Reddit from './reddit.model';
import creds from '../../config/local.env';
import Token from '../validate/validate.model';
import User from '../user/user.model';
import Snoocore from 'snoocore';
import NLP from 'stanford-corenlp';
import path from 'path';

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

var config = {
  'nlpPath': ('./corenlp'), //the path of corenlp
  'version':'3.5.2', //what version of corenlp are you using
  'annotators': ['tokenize','ssplit','pos','parse','sentiment','depparse','quote'], //optional!
  'extra' : {
      'depparse.extradependencie': 'MAXIMAL'
    }
};

var coreNLP = new NLP.StanfordNLP(config);

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

function checkIfDateExists(dates, currentMonth, currentYear) {
  var index = -1;
  dates.forEach(function(date, i) {
    if (date.month == currentMonth && date.year == currentYear) {
      index = i;
    }
  });
  return index;
}

function createUser(req, res, callback) {
    var userData = new User({username: req.params.username});
    var userComments = [];
    var dateData = [];
    var monthNames = ["January", "February", "March", "April", "May", "June",
                      "July", "August", "September", "October", "November", "December"];
    var earliestComment = Number.MAX_VALUE;
    var date, currentMonth, currentYear, currentHour, currentDay;
    var commentLink, isSelfPostHelper, isSelfPost, isFlaired;
    var currentCommentScore = 0,
        currentPostCount    = 0,
        totalCommentCount   = 0,
        totalEditedCommentCount = 0,
        totalEditedTimeRange = 0,
        totalnsfw = 0,
        totalControversial = 0,
        totalCommentsGilded = 0,
        totalGilds = 0,
        totalWords = 0,
        totalFlaired = 0;

    var editedTimes = []; //stores all times of edits
    var commentLengths = []; //store lengths of comments
    var commentSubreddits = []; //store subreddits comments are in
    var hourTracker = new Array(24+1).join('0').split('').map(parseFloat); //24-wide array of 0s
    var hourScorer = new Array(24+1).join('0').split('').map(parseFloat); //24-wide array of 0s
    var dayTracker = new Array(7+1).join('0').split('').map(parseFloat); //7-wide array of 0s
    var dayScorer = new Array(7+1).join('0').split('').map(parseFloat); //7-wide array of 0s

     getUserComments(req, res, function(allComments) { /* get all user comments */
        date = new Date(allComments[0].data.children[0].data.created_utc * 1000); /* add bounds checking */
        currentMonth = date.getMonth();
        currentYear = date.getFullYear();

        allComments.forEach(function(commentSlice) {
          commentSlice.data.children.forEach(function(currentComment) {
            userComments.push(currentComment.data.body);
              if (currentComment.data.created_utc < earliestComment) {
                earliestComment = currentComment.data.created_utc;
              }

              date = new Date(currentComment.data.created_utc * 1000);
              if (date.getMonth() == currentMonth && date.getFullYear() == currentYear) {
                  currentCommentScore += currentComment.data.score;
                  currentPostCount++;
              }
              else if (checkIfDateExists(dateData, monthNames[currentMonth], currentYear) > -1) {
                  var i = checkIfDateExists(dateData, monthNames[currentMonth], currentYear);
                  dateData[i].commentKarmaForMonth += currentComment.data.score;
                  dateData[i].postsForMonth++;
                  currentMonth = date.getMonth();
                  currentYear = date.getFullYear();
                  currentCommentScore = 0;
                  currentPostCount = 0;
              }
              else {
                dateData.push({
                                    month: monthNames[currentMonth],
                                    date: ("0" + date.getDate()).slice(-2),
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

              currentDay = date.getDay(); //get day 0-6
              dayTracker[currentDay]++; //increment count for that day
              dayScorer[currentDay] += currentComment.data.score; //add comment's score to running total for day

              totalCommentCount++; //track total number of comments
              if (currentComment.data.edited != false)
              {
                if (currentComment.data.edited != true) //certain old comments only have 'true' stored
                {
                  totalEditedCommentCount++; //add to count of edited comments
                  totalEditedTimeRange += currentComment.data.edited - currentComment.data.created_utc; //add time difference of last edit
                  editedTimes.push(currentComment.data.edited - currentComment.data.created_utc); //store it for later
                }
              }

              //Track some comment metadata
              if (currentComment.data.over_18 == true)
              {
                totalnsfw++; //add to count of nsfw comments
              }
              if (currentComment.data.controversiality > 0)
              {
                totalControversial++; //add to count of controversial comments
              }
              if (currentComment.data.gilded > 0)
              {
                totalGilds += currentComment.data.gilded; //add number of gilds for this comment
                totalCommentsGilded++; //increase count of comments gilded at least once
              }
              if (currentComment.data.author_flair_css_class != null)
              {
                totalFlaired++;
                isFlaired = 1;
              }
              else
              {
                isFlaired = 0;
              }

              totalWords += Math.round(currentComment.data.body.toString().length / 5); //approx. word count tracking
              commentLengths.push(currentComment.data.body.toString().length); //store length of current comment
              commentSubreddits.push(currentComment.data.subreddit.toString()); //store subreddit comment is in

              commentLink = currentComment.data.link_url.toString();
              isSelfPostHelper = commentLink.search("/comments/"); //if the URL has '/comments/' in it, then it's almost certainly a selfpost
              //value will be -1 if a normal link, some integer otherwise
              if (isSelfPostHelper > 0) //simplify to yes/no value
              {
                isSelfPost = 1;
              }
              else
              {
                isSelfPost = 0;
              }

              //store metadata on each comment
              userData.comMeta.push({
                subreddit: currentComment.data.subreddit.toString(),
                link: commentLink,
                linkType: isSelfPost,
                length: currentComment.data.body.toString().length,
                gilded: currentComment.data.gilded,
                flaired: isFlaired,
                hour: currentHour,
                day: currentDay,
                month: currentMonth,
                year: currentYear
              });
          });
        });

        userData.totalComments = totalCommentCount;
        userData.totalEditedComments = totalEditedCommentCount;
        userData.avgEditTime = totalEditedTimeRange / totalEditedCommentCount; //this is in seconds
        editedTimes.sort(); //sort lowest to highest
        userData.medEditTime = editedTimes[Math.floor(editedTimes.length/2)]; //store median time
        userData.nsfwComments = totalnsfw;
        userData.controversialComments = totalControversial;
        userData.gildedComments = totalCommentsGilded;
        userData.totalGilds = totalGilds;
        userData.totalWords = totalWords;
        userData.totalFlaired = totalFlaired;

        var comLengthSum = commentLengths.reduce(function(a, b) { return a + b; });
        userData.avgCommentLength = comLengthSum / commentLengths.length; //store average length

        for (var i = 0; i < hourTracker.length; i++) //store comment hourly data
        {
          userData.hour.push({
            hour: i,
            postsForHour: hourTracker[i],
            commentKarmaForHour: hourScorer[i]
          });
        }

        for (var i = 0; i < dayTracker.length; i++) //store comment hourly data
        {
          userData.day.push({
            day: i,
            postsForDay: dayTracker[i],
            commentKarmaForDay: dayScorer[i]
          });
        }

        ///////////////////////////////////////////////
        //Estimating Region Section
        //Highest activity hours: 7-9PM, lowest: 4-6AM
        var maxActivity, minActivity, maxActivityHours, minActivityHours, maxActivityAvg, minActivityAvg;
        var region;

        function getAllIndexes(arr, val) {
            var indexes = [], i;
            for(i = 0; i < arr.length; i++)
                if (arr[i] === val)
                    indexes.push(i);
            return indexes;
        }

        maxActivityHours = getAllIndexes(hourTracker, Math.max.apply(Math, hourTracker));
        minActivityHours = getAllIndexes(hourTracker, Math.min.apply(Math, hourTracker));

        //console.log(maxActivityHours + " " + minActivityHours);

        var maxSum = maxActivityHours.reduce(function(a, b) { return a + b; });
        maxActivity = maxSum / maxActivityHours.length; //get max avg value hour from array
        var minSum = minActivityHours.reduce(function(a, b) { return a + b; });
        minActivity = minSum / minActivityHours.length; //get min

        //console.log(maxActivity + " " + minActivity);

        if (maxActivity <= 23 && maxActivity >= 16 && minActivity >= 3 && minActivity <= 9)
        {
          region = "Europe/Africa";
        }
        else if (maxActivity <= 18 && maxActivity >= 11 && minActivity >=0 && (minActivity <= 4 || minActivity == 23 || minActivity == 22))
        {
          region = "Americas";
        }
        else if (maxActivity <= 7 && maxActivity >= 0 && minActivity >= 7 && minActivity <= 16)
        {
          region = "Asia/Australia";
        }
        else
        {
          region = "Uncertain";
        }

        userData.region = region;
        ////////////////////////////////////////////////

        positivity(userComments, function(sentenceCount, negativeSentenceCounts, negativeSample) {
            userData.data = dateData;
            userData.availableFrom = earliestComment*1000;
            userData.negativePercentage = (negativeSentenceCounts / sentenceCount).toPrecision(2) * 100;
            userData.negativeExample = negativeSample;

            getKarmaAndDate(req, res, function(scores) { /* get total karma scores and creation timestamp */
              userData.karma.totalCommentScore = scores.comments;
              userData.karma.totalLinkScore = scores.submissions;
              userData.creationTime = (scores.created)*1000;

              callback(userData);
            });
        });      
  });
}

function positivity (comments, callback) {
    var sentenceCounter = 0,
        negativeSentenceCount = 0,
        negativeCommentCount = 0,
        negativeComments = [];

    comments.forEach(function(currentComment, i) {
        coreNLP.process(currentComment, function(err, result) {
          if (Array.isArray(result.document.sentences.sentence)) {
            result.document.sentences.sentence.forEach(function(x) {
                sentenceCounter = sentenceCounter + 1;
                // console.log(sentenceCounter + "\n");
                if (Array.isArray(x.tokens.token)) {
                    x.tokens.token.forEach(function(y) {
                        if (y.sentiment == "Very negative") {
                            if (negativeCommentCount < 3) {
                              negativeComments.push({content: currentComment, trigger: y.word});
                              negativeCommentCount++;
                            }
                            negativeSentenceCount++;
                            return;
                        }
                        // console.log(y.sentiment + 1);
                    });
                }
                else {
                  if (x.tokens.token.sentiment == "Very negative") {
                      if (negativeCommentCount < 3) {
                              negativeComments.push({content: currentComment, trigger: x.tokens.token.word});
                              negativeCommentCount++;
                      }
                      negativeSentenceCount++;
                  }
                }
            });
          }
          else {
              sentenceCounter = sentenceCounter + 1;

              if (Array.isArray(result.document.sentences.sentence.tokens.token)) {
                  result.document.sentences.sentence.tokens.token.forEach(function(z) {
                      if (z.sentiment == "Very negative") {
                        if (negativeCommentCount < 3) {
                              negativeComments.push({content: currentComment, trigger: z.word});
                              negativeCommentCount++;
                        }
                        negativeSentenceCount++;
                        return;
                      }
                  });
              }
              else {
                  if (result.document.sentences.sentence.tokens.token.sentiment == "Very negative") {
                      if (negativeCommentCount < 3) {
                            nnegativeComments.push({content: currentComment, trigger: result.document.sentences.sentence.tokens.token.word});
                            negativeCommentCount++;
                      }
                      negativeSentenceCount++;
                  }
              }
          }
          if (i === comments.length-1) {
          console.log("\n\ncallback time\n\n" + i);
          callback(sentenceCounter, negativeSentenceCount, negativeComments);
          return;
          }
      }); 
      
    });
    return;
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

/* ======================================================================== */
/* ======================================================================== */
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