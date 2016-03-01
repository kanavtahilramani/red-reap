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
  'annotators': ['tokenize','ssplit','pos', 'lemma', 'ner','parse','sentiment','depparse','quote'], //optional!
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
    var currentCommentScore = 0,
        currentPostCount    = 0,
        totalCommentCount   = 0,
        totalEditedCommentCount = 0,
        totalEditedTimeRange = 0;

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

              commentLengths.push(currentComment.data.body.toString().length); //store length of current comment
              commentSubreddits.push(currentComment.data.subreddit.toString()); //store subreddit comment is in

              //store metadata on each comment
              userData.comMeta.push({
                subreddit: currentComment.data.subreddit.toString(),
                link: currentComment.data.link_url.toString(),
                length: currentComment.data.body.toString().length,
                hour: currentHour,
                day: currentDay,
                month: currentMonth,
                year: currentYear
              });
          });
        });

        userData.totalComments = totalCommentCount;
        userData.totalEditedComments = totalEditedCommentCount;
        userData.avgEditTime = totalEditedTimeRange / totalEditedCommentCount;
        editedTimes.sort(); //sort lowest to highest
        userData.medEditTime = editedTimes[Math.floor(editedTimes.length/2)]; //store median time

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

        positivity(userComments, function(sentenceCount, negativeSentenceCounts, negativeSample, vnAdjs, nAdjs, pAdjs, vpAdjs, exVN, exN, exP, exVP, vnPerin, nPerin, pPerin, vpPerin) {
            userData.data = dateData;
            userData.availableFrom = earliestComment*1000;
            userData.negativePercentage = (negativeSentenceCounts / sentenceCount).toPrecision(3) * 100;
            userData.negativeExample = negativeSample;
            
            userData.veryNegativeAdjs = vnAdjs;
            userData.negativeAdjs = nAdjs;
            userData.positiveAdjs = pAdjs;
            userData.veryPositiveAdjs = vpAdjs;
            userData.vnEx = exVN;
            userData.nEx = exN;
            userData.pEx = exP;
            userData.vpEx = exVP;
            userData.vnPer = vnPerin.toPrecision(3);
            userData.nPer = nPerin.toPrecision(3);
            userData.pPer = pPerin.toPrecision(3);
            userData.vpPer = vpPerin.toPrecision(3);

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
        negativeComments = [],
        veryNegAdEx = [],
        negAdEx = [],
        posAdEx = [],
        veryPosAdEx = [],
        adjVN = 0,
        adjN = 0,
        adjP = 0,
        adjVP = 0,
        adjPerVN = 0,
        adjPerN = 0,
        adjPerP = 0,
        adjPerVP = 0,
        vnExCount = 0,
        nExCount = 0,
        pExCount = 0,
        vpExCount = 0,
        descriptor = "",
        totalDescriptions = [],
        adverbExists = false,
        adverbExistsTwo = false,
        UCPadverbExists = false;

    comments.forEach(function(currentComment, i) {
        coreNLP.process(currentComment, function(err, result) {
          
          if (Array.isArray(result.document.sentences.sentence)) {
            result.document.sentences.sentence.forEach(function(x) {
                sentenceCounter = sentenceCounter + 1;
                if (Array.isArray(x.tokens.token)) {
                    x.tokens.token.forEach(function(y, index) {
                        //checking and counting sentiment if its an adjective
                        if (y.word == 'I' || y.word == 'i') {
                            if (index < x.tokens.token.length-2) {
                                if (x.tokens.token[index+1].lemma == "be") {
                                    x.parsedTree.children[0].children.forEach(function(p) {
                                        if (p.type == "VP") {
                                            if (p.children[0].children[0].id == x.tokens.token[index+1].$.id) {
                                                p.children.forEach(function(phrase) {
                                                    if (phrase.type != "NP" && phrase.type != "VB" && phrase.type != "VBD" && phrase.type != "VBG" && phrase.type != "VBN" && phrase.type != "VBP" && phrase.type != "VBZ") {
                                                        adverbExists = true;
                                                    }
                                                    if (phrase.children[0].type == "NP") {
                                                        if (phrase.children[0].type != "NP" && phrase.children[0].type != "VB" && phrase.children[0].type != "VBD" && phrase.children[0].type != "VBG" && phrase.children[0].type != "VBN" && phrase.children[0].type != "VBP" && phrase.children[0].type != "VBZ") {
                                                          adverbExistsTwo = true; //reset
                                                        }
                                                        if (!adverbExistsTwo) {
                                                            phrase.children[0].children.forEach(function(description, index) {
                                                                descriptor += description.children[0].word;
                                                                descriptor += " ";
                                                                if (index == phrase.children[0].children.length-1){
                                                                          console.log("\nTop test (NON UCP).\n");
                                                                          console.log(currentComment + "\n");
                                                                          console.log(descriptor);
                                                                          console.log("\n================================");
                                                                          descriptor = "";
                                                                }
                                                            });
                                                        }
                                                    }
                                                    else if (phrase.type == "NP" && !adverbExists) { /* NON UCP */
                                                        phrase.children.forEach(function(description, index) {
                                                            descriptor += description.children[0].word;
                                                            descriptor += " ";
                                                            if (index == phrase.children.length-1){
                                                                      console.log("\nTop test (NON UCP).\n");
                                                                      console.log(currentComment + "\n");
                                                                      console.log(descriptor);
                                                                      console.log("\n================================");
                                                                      descriptor = "";
                                                            }
                                                        });
                                                    }
                                                    else if (phrase.type == "UCP") { /* UCP */
                                                        phrase.children.forEach(function(outer) {
                                                            if (outer.type != "NP" && outer.type != "VB" && outer.type != "VBD" && outer.type != "VBG" && outer.type != "VBN" && outer.type != "VBP" && outer.type != "VBZ") {
                                                              UCPadverbExists = true;
                                                            }
                                                            if (outer.type == "NP" && !adverbExists) {
                                                                outer.children.forEach(function(description, index) {
                                                                  descriptor += description.children[0].word;
                                                                  descriptor += " ";
                                                                  if (index == outer.children.length-1) {
                                                                      console.log("\nBottom test (UCP).\n");
                                                                      console.log(currentComment + "\n");
                                                                      console.log(descriptor);
                                                                      console.log("\n================================");
                                                                      descriptor = "";
                                                                  }
                                                                });
                                                            }
                                                        });
                                                    }
                                                });
                                                adverbExists = false;
                                                adverbExistsTwo = false;
                                                UCPadverbExists = false;
                                            }
                                        }
                                    });
                                }
                            }
                        }

                        if (y.POS == 'JJ'|| y.POS == 'JJR' || y.POS == 'JJS'){
                            if (y.sentiment== "Very negative"){
                              if (vnExCount<=20){
                                vnExCount++;
                                veryNegAdEx.push({adjective: y.word});
                              }
                              adjVN++;
                            }
                            if (y.sentiment== "Negative"){
                              if (nExCount<=20){
                                nExCount++;
                                negAdEx.push({adjective: y.word});
                              }
                              adjN++;
                            }
                            if (y.sentiment== "Positive"){
                              if (pExCount<=20){
                                pExCount++;
                                posAdEx.push({adjective: y.word});
                              }
                              adjP++;
                            }
                            if (y.sentiment== "Very positive"){
                              if (vpExCount<=20){
                                vpExCount++;
                                veryPosAdEx.push({adjective: y.word});
                              }
                              adjVP++;
                            }

                        }

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
                  //checking and counting sentiment if its an adjective
                  if (x.tokens.token.POS == 'JJ' || x.tokens.token.POS == 'JJR' || x.tokens.token.POS == 'JJS'){
                      if (x.tokens.token.sentiment== "Very negative"){
                        if (vnExCount<=20){
                          vnExCount++;
                          veryNegAdEx.push({adjective: x.tokens.token.word});
                          }
                        adjVN++;
                      }
                      if (x.tokens.token.sentiment== "Negative"){
                        if (nExCount<=20){
                          nExCount++;
                          negAdEx.push({adjective: x.tokens.token.word});
                        }
                        adjN++;
                      }
                      if (x.tokens.token.sentiment== "Positive"){
                        if (pExCount<=20){
                          pExCount++;
                          posAdEx.push({adjective: x.tokens.token.word});
                        }
                        adjP++;
                      }
                      if (x.tokens.token.sentiment== "Very positive"){
                        if (vpExCount<=20){
                          vpExCount++;
                          veryPosAdEx.push({adjective: x.tokens.token.word});
                          }
                        adjVP++;
                      }

                  }
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
                      if (z.POS == 'JJ' || z.POS == 'JJR' || z.POS == 'JJS'){
                          if (z.sentiment== "Very negative"){
                            if (vnExCount<=20){
                              vnExCount++;
                              veryNegAdEx.push({adjective: z.word});
                            }
                            adjVN++;
                          }
                          if (z.sentiment== "Negative"){
                            if (nExCount<=20){
                              nExCount++;
                              negAdEx.push({adjective: z.word});
                            }
                            adjN++;
                          }
                          if (z.sentiment== "Positive"){
                            if (pExCount<=20){
                              pExCount++;
                              posAdEx.push({adjective: z.word});
                            }
                            adjP++;
                          }
                          if (z.sentiment== "Very positive"){
                            if (vpExCount<=20){
                              vpExCount++;
                              veryPosAdEx.push({adjective: z.word});
                            }
                            adjVP++;
                          }

                      }
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
                  if (result.document.sentences.sentence.tokens.token.POS == 'JJ' || result.document.sentences.sentence.tokens.token.POS == 'JJR' || result.document.sentences.sentence.tokens.token.POS == 'JJS'){
                          if (result.document.sentences.sentence.tokens.token.sentiment== "Very negative"){
                            if (vnExCount<=20){
                              vnExCount++;
                              veryNegAdEx.push({adjective: result.document.sentences.sentence.tokens.token.word});
                            }
                            adjVN++;
                          }
                          if (result.document.sentences.sentence.tokens.token.sentiment== "Negative"){
                            if (nExCount<=20){
                              nExCount++;
                              negAdEx.push({adjective: result.document.sentences.sentence.tokens.token.word});
                            }
                            adjN++;
                          }
                          if (result.document.sentences.sentence.tokens.token.sentiment== "Positive"){
                            if (pExCount<=20){
                              pExCount++;
                              posAdEx.push({adjective: result.document.sentences.sentence.tokens.token.word});
                            }
                            adjP++;
                          }
                          if (result.document.sentences.sentence.tokens.token.sentiment== "Very positive"){
                            if (vpExCount<=20){
                              vpExCount++;
                              veryPosAdEx.push({adjective: result.document.sentences.sentence.tokens.token.word});
                            }
                            adjVP++;
                          }

                      }
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

          adjPerVN = 100*((adjVN)/(adjVN+adjN+adjP+adjVP)); 
          adjPerN = 100*((adjN)/(adjVN+adjN+adjP+adjVP));
          adjPerP = 100*((adjP)/(adjVN+adjN+adjP+adjVP));
          adjPerVP = 100*((adjVP)/(adjVN+adjN+adjP+adjVP));
          callback(sentenceCounter, negativeSentenceCount, negativeComments, adjVN, adjN, adjP, adjVP, veryNegAdEx, negAdEx, posAdEx, veryPosAdEx, adjPerVN, adjPerN, adjPerP, adjPerVP);
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