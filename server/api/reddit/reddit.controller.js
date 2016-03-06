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
    var userSubmitted = [];
    var dateData = [];
    var dateDataSubmitted = [];
    var monthNames = ["January", "February", "March", "April", "May", "June",
                      "July", "August", "September", "October", "November", "December"];
    var earliestComment = Number.MAX_VALUE;
    var earliestSubmitted = Number.MAX_VALUE;
    var date, currentMonth, currentYear, currentHour, currentDay;
    var commentLink, isSelfPostHelper, isSelfPost, isFlaired, isDistinguished, comLevel;
    var currentCommentScore = 0,
        currentSubmittedScore = 0,
        currentPostCount    = 0,
        totalCommentCount   = 0,
        totalEditedCommentCount = 0,
        totalEditedTimeRange = 0,
        totalnsfw = 0,
        totalControversial = 0,
        totalCommentsGilded = 0,
        totalGilds = 0,
        totalWords = 0,
        totalFlaired = 0,
        totalDistinguished = 0,
        totalReplyComments = 0;

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
              if(currentComment.data.distinguished != null)
              {
                totalDistinguished++;
                isDistinguished = 1;
              }
              else
              {
                isDistinguished = 0;
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

              if (currentComment.data.link_id != currentComment.data.parent_id) //if this is case, comment is reply to another comment
              {
                comLevel = 1; //indicates comment is reply to another comment
                totalReplyComments++;
              }
              else
              {
                comLevel = 0; //indicates comment is directly on submission
              }

              //store metadata on each comment
              userData.comMeta.push({
                score: currentComment.data.score,
                subreddit: currentComment.data.subreddit.toString(),
                link: commentLink,
                linkType: isSelfPost,
                length: currentComment.data.body.toString().length,
                gilded: currentComment.data.gilded,
                flaired: isFlaired,
                distinguished: isDistinguished,
                hour: currentHour,
                day: currentDay,
                month: currentMonth,
                year: currentYear,
                level: comLevel
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
        userData.totalReplyComments = totalReplyComments;

        var comLengthSum = commentLengths.reduce(function(a, b) { return a + b; });
        userData.avgCommentLength = comLengthSum / commentLengths.length; //store average length

        for (var i = 0; i < hourTracker.length; i++) //store comment hourly data
        {
          userData.hour.push({
            hour: i,
            postsForHour: hourTracker[i],
            karmaForHour: hourScorer[i]
          });
        }

        for (var i = 0; i < dayTracker.length; i++) //store comment hourly data
        {
          userData.day.push({
            day: i,
            postsForDay: dayTracker[i],
            karmaForDay: dayScorer[i]
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

            //console.log("proof1");
            ///////////////////////////////////////////////////
            //////////////SUBMISSIONS SECTION//////////////////
            ///////////////////////////////////////////////////

            currentPostCount = 0; //reset from comments section
            var date2;
            var submittedLink;
            var currentPostLength = 0;
            var totalSubmittedCount = 0,
                totalSubmittednsfw = 0,
                totalSubmittedControversial = 0,
                totalSubmittedGilded = 0,
                totalSubmittedGilds = 0,
                totalSubmittedWords = 0,
                totalSubmittedFlaired = 0,
                totalSubmittedDistinguished = 0,
                totalCommentsOnSubmitted = 0,
                totalSelfPosts = 0;

            var submittedSubreddits = []; //store subreddits submissions are in
            var submittedLengths = []; //store lengths of self posts
            var hourTracker2 = new Array(24+1).join('0').split('').map(parseFloat); //24-wide array of 0s
            var hourScorer2 = new Array(24+1).join('0').split('').map(parseFloat); //24-wide array of 0s
            var dayTracker2 = new Array(7+1).join('0').split('').map(parseFloat); //7-wide array of 0s
            var dayScorer2 = new Array(7+1).join('0').split('').map(parseFloat); //7-wide array of 0s

            getUserSubmitted(req, res, function(allSubmitted) { /* get all user submissions */
              
              //console.log(allSubmitted[0].data.children[0]);
              date2 = new Date(allSubmitted[0].data.children[0].data.created_utc * 1000); /* add bounds checking */
              currentMonth = date2.getMonth();
              currentYear = date2.getFullYear();
              
              allSubmitted.forEach(function(submittedSlice) {
                submittedSlice.data.children.forEach(function(currentSubmitted) {
                  
                  userSubmitted.push(currentSubmitted.data.body);

                  if (currentSubmitted.data.created_utc < earliestSubmitted) {
                    earliestSubmitted = currentSubmitted.data.created_utc;
                  }

                  date2 = new Date(currentSubmitted.data.created_utc * 1000);
                  if (date2.getMonth() == currentMonth && date2.getFullYear() == currentYear) {
                      currentSubmittedScore += currentSubmitted.data.score;
                      currentPostCount++;
                  }
                  else if (checkIfDateExists(dateDataSubmitted, monthNames[currentMonth], currentYear) > -1) {
                      var i = checkIfDateExists(dateDataSubmitted, monthNames[currentMonth], currentYear);
                      dateDataSubmitted[i].SubmittedKarmaForMonth += currentSubmitted.data.score;
                      dateDataSubmitted[i].postsForMonth++;
                      currentMonth = date2.getMonth();
                      currentYear = date2.getFullYear();
                      currentSubmittedScore = 0;
                      currentPostCount = 0;
                  }
                  else {
                    dateDataSubmitted.push({
                                        month: monthNames[currentMonth],
                                        date: ("0" + date2.getDate()).slice(-2),
                                        year: currentYear,
                                        linkKarmaForMonth: currentSubmittedScore,
                                        postsForMonth: currentPostCount
                                      });
                    currentMonth = date2.getMonth();
                    currentYear = date2.getFullYear();
                    currentSubmittedScore = 0;
                    currentPostCount = 0;
                  }

                  currentHour = date2.getHours(); //get UTC hour Submitted was posted
                  hourTracker2[currentHour]++; //increment count for that hour
                  hourScorer2[currentHour] += currentSubmitted.data.score; //add Submitted's score to running total for hour

                  currentDay = date2.getDay(); //get day 0-6
                  dayTracker2[currentDay]++; //increment count for that day
                  dayScorer2[currentDay] += currentSubmitted.data.score; //add Submitted's score to running total for day

                  totalSubmittedCount++; //track total number of Submitted

                  //Track some Submitted metadata
                  if (currentSubmitted.data.over_18 == true)
                  {
                    totalSubmittednsfw++; //add to count of nsfw Submitted
                  }
                  if (currentSubmitted.data.controversiality > 0)
                  {
                    totalSubmittedControversial++; //add to count of controversial Submitted
                  }
                  if (currentSubmitted.data.gilded > 0)
                  {
                    totalSubmittedGilds += currentSubmitted.data.gilded; //add number of gilds for this Submitted
                    totalSubmittedGilded++; //increase count of Submitted gilded at least once
                  }
                  if (currentSubmitted.data.link_flair_css_class != null)
                  {
                    totalSubmittedFlaired++;
                    isFlaired = 1;
                  }
                  else
                  {
                    isFlaired = 0;
                  }
                  if(currentSubmitted.data.distinguished != null)
                  {
                    totalSubmittedDistinguished++;
                    isDistinguished = 1;
                  }
                  else
                  {
                    isDistinguished = 0;
                  }

                  if (currentSubmitted.data.selftext_html != null)
                  {
                    currentPostLength = currentSubmitted.data.selftext_html.toString().length;
                    totalSubmittedWords += Math.round(currentPostLength / 5)
                    submittedLengths.push(currentPostLength);
                  }
                  else
                  {
                    currentPostLength = 0;
                  }

                  submittedSubreddits.push(currentSubmitted.data.subreddit.toString()); //store subreddit Submitted is in

                  submittedLink = currentSubmitted.data.url.toString();
                  
                  isSelfPost = currentSubmitted.data.is_self;
                  if (isSelfPost)
                  {
                    totalSelfPosts++;
                  }

                  totalCommentsOnSubmitted += currentSubmitted.data.num_comments;

                  //store metadata on each Submitted
                  userData.subMeta.push({
                    score: currentSubmitted.data.score,
                    subreddit: currentSubmitted.data.subreddit.toString(),
                    link: submittedLink,
                    linkType: isSelfPost,
                    length: currentPostLength,
                    gilded: currentSubmitted.data.gilded,
                    flaired: isFlaired,
                    distinguished: isDistinguished,
                    hour: currentHour,
                    day: currentDay,
                    month: currentMonth,
                    year: currentYear,
                    comments: currentSubmitted.data.num_comments,
                    title: currentSubmitted.data.title.toString()
                  });


                });
              });

              userData.totalSubmitted = totalSubmittedCount;
              userData.nsfwSubmitted = totalSubmittednsfw;
              userData.controversialSubmitted = totalSubmittedControversial;
              userData.gildedSubmitted = totalSubmittedGilded;
              userData.totalSubmittedGilds = totalSubmittedGilds;
              userData.totalSubmittedWords = totalSubmittedWords;
              userData.totalSubmittedFlaired = totalSubmittedFlaired;
              userData.totalSubmittedDistinguished = totalSubmittedDistinguished;
              userData.totalCommentsOnSubmitted = totalCommentsOnSubmitted;
              userData.avgCommentsOnSubmitted = totalCommentsOnSubmitted / totalSubmittedCount;
              userData.totalSelfPosts = totalSelfPosts;
              userData.totalLinkPosts = totalSubmittedCount - totalSelfPosts;

              var subLengthSum = submittedLengths.reduce(function(a, b) { return a + b; });
              userData.avgSelfPostLength = subLengthSum / submittedLengths.length; //store average length

              for (var i = 0; i < hourTracker2.length; i++) //store submitted hourly data
              {
                userData.hourSub.push({
                  hour: i,
                  postsForHour: hourTracker2[i],
                  karmaForHour: hourScorer2[i]
                });
              }

              for (var i = 0; i < dayTracker2.length; i++) //store submitted hourly data
              {
                userData.daySub.push({
                  day: i,
                  postsForDay: dayTracker2[i],
                  karmaForDay: dayScorer2[i]
                });
              }

              userData.dataSub = dateDataSubmitted; //store monthly data for submissions

              getKarmaAndDate(req, res, function(scores) { /* get total karma scores and creation timestamp */
                userData.karma.totalCommentScore = scores.comments;
                userData.karma.totalLinkScore = scores.submissions;
                userData.creationTime = (scores.created)*1000;

                callback(userData);
              });

            });

            //console.log("proof3");

            //////////////////////////////END SUBMISSION SECTION//////////////////////////////////
            
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

export function getUserSubmitted (req, res, callback) {
  function loop(slice, prevSubmitted) {
    if (slice.data.children.length < 100 || i >= 10) {
      callback(slices);
      return;
    }

    i++;

    reddit('/user/' + username + '/submitted/').get({ limit: 100, after: prevSubmitted }).then(function(currentSlice) {
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

  reddit('/user/' + username + '/submitted/').get({ limit: 100 }).then(function(firstSlice) {
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