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
  'annotators': ['tokenize','ssplit','pos', 'lemma', 'ner','parse','sentiment','depparse','quote','cleanxml'], //optional!
  'extra' : {
      'depparse.extradependencie': 'MAXIMAL'
    }
};

var coreNLP = new NLP.StanfordNLP(config);

var username;

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

function createUser(callback) {
    var userData = new User({username: username});
    var commentLink, isSelfPostHelper, isSelfPost, isFlaired, region;
    var monthData = [];
    var earliestComment = Number.MAX_VALUE;
    var date, currentMonth, currentYear, currentHour, currentDay;
    var totalCommentCount   = 0, 
        totalEditedCommentCount = 0,
        totalEditedTimeRange = 0,
        totalnsfw = 0,
        totalControversial = 0,
        totalCommentsGilded = 0,
        totalGilds = 0,
        totalWords = 0,
        totalFlaired = 0;

    var sentenceCounter = 0,
        negativeSentenceCount = 0,
        negativeComments = [],
        adjVN = 0,
        adjN = 0,
        adjP = 0,
        adjVP = 0,
        adjPerVN = 0,
        adjPerN = 0,
        adjPerP = 0,
        adjPerVP = 0,
        veryNegAdEx = [],
        negAdEx = [],
        posAdEx = [],
        veryPosAdEx = [],
        familyMems = [],
        filteredArray = [],
        userComments = [];

    var done = false;

    var hourTracker = new Array(24+1).join('0').split('').map(parseFloat), //24-wide array of 0s
        hourScorer = new Array(24+1).join('0').split('').map(parseFloat), //24-wide array of 0s
        dayTracker = new Array(7+1).join('0').split('').map(parseFloat), //7-wide array of 0s
        dayScorer = new Array(7+1).join('0').split('').map(parseFloat); //7-wide array of 0s

    var editedTimes = []; //stores all times of edits
    var commentLengths = []; //store lengths of comments
    var commentSubreddits = []; //store subreddits comments are in

    function getNLPData (comments, callback) {
      var negativeCommentCount = 0,
          vnExCount = 0,
          nExCount = 0,
          pExCount = 0,
          vpExCount = 0,
          numCalls = 0,
          numComments = 0,
          currentCommentIndex = 0,
          totalDescriptions = [],
          descriptorSet = [],
          copySet = [],
          adverbExists = false,
          adverbExistsTwo = false,
          nonNounFound = false,
          descriptorNounFound = false,
          descriptorNonNounFound = false,
          UCPadverbExists = false,
          isFinished = false,
          isFiltered = false,
          counter = 0,
          descriptor = "";

      function getSentimentData (currentWord, currentComment) {
          if (currentWord.POS == 'JJ'|| currentWord.POS == 'JJR' || currentWord.POS == 'JJS') {
              if (currentWord.sentiment== "Very negative"){
                if (vnExCount<=20){
                  vnExCount++;
                  veryNegAdEx.push({adjective: currentWord.word});
                }
                adjVN++;
              }
              if (currentWord.sentiment== "Negative"){
                if (nExCount<=20){
                  nExCount++;
                  negAdEx.push({adjective: currentWord.word});
                }
                adjN++;
              }
              if (currentWord.sentiment== "Positive"){
                if (pExCount<=20){
                  pExCount++;
                  posAdEx.push({adjective: currentWord.word});
                }
                adjP++;
              }
              if (currentWord.sentiment== "Very positive"){
                if (vpExCount<=20){
                  vpExCount++;
                  veryPosAdEx.push({adjective: currentWord.word});
                }
                adjVP++;
              }
          }

          if (currentWord.sentiment == "Very negative") {
              if (negativeCommentCount < 3) {
                negativeComments.push({content: currentComment, trigger: currentWord.word});
                negativeCommentCount++;
              }
              negativeSentenceCount++;
              return;
          }
      }

      // change all tokenizedcomment
      //start by using parsedTree as tier for top call to FindYouAre
      function FindYouAre(tier, toBeId, onTheHunt) {
        numCalls++;
        if (tier.type == "NP " && onTheHunt) {
          //console.log("found NP and onTheHunt");
          //if i have grandchildren, call on my children
        
         //console.log("Non terminal NP, calling on children");
            tier.children.forEach(function(childTwo) {
                FindYouAre(childTwo, toBeId, true);
            });
            numCalls--;
            if (numCalls === 0) {
              isFinished = true;
              return;
            }
            else
              return;
        }

         if (tier.type == "NP" && onTheHunt) {
           //console.log("This is the terminal NP saving");
            descriptorNounFound = false;
            descriptorNonNounFound = false;
            
            tier.children.forEach(function(description, index) {
                if (description.type == "NN" || description.type == "NNP" || description.type == "NNPS" || description.type == "NNS"){
                    descriptorNounFound = true;
                    }
                
                else if(descriptorNounFound){
                    descriptorNonNounFound = true;
                }

                if (!descriptorNonNounFound){
                    descriptor += description.children[0].word;
                    descriptor += " ";
                }
            });
            // console.log("\n\n" + descriptor + "\n\n");
            descriptorSet.push(descriptor);              
            descriptor = "";
            descriptorNounFound = false;
            descriptorNonNounFound = false;
            numCalls--;

            if (numCalls === 0) {
              isFinished = true;
              return;
            }
            else
              return;
          }

          if ((tier.type == "VP") && (tier.children[0].children[0].id == toBeId)){
             // console.log("found VP with matching id");
              tier.children.forEach(function(child){
                FindYouAre(child, toBeId, true);
              });
              numCalls--;

              if (numCalls === 0) {
                isFinished = true;
                return;
              }
              else
                return;
          }
          
          else if (tier.children[0].hasOwnProperty('children')) {
              tier.children.forEach(function(childThree){
                FindYouAre(childThree, toBeId, false);
              });
              numCalls--;

              if (numCalls === 0) {
                isFinished = true;
                return;
              }
              else
                return;
          }

          else {
            numCalls--;

            if (numCalls === 0) {
              isFinished = true;
              return;
            }
            else
              return;
          }
        }

        function getFamilyMembers (currentWord, nextWord) {
            if (currentWord.word == "My" || currentWord.word == "my") {
                if (nextWord.word=="mom" ||
                    nextWord.word=="Mom" ||
                    nextWord.word=="Dad" ||
                    nextWord.word=="dad" ||
                    nextWord.word=="sister" ||
                    nextWord.word=="Sister" ||
                    nextWord.word=="brother" ||
                    nextWord.word=="Brother" ||
                    nextWord.word=="Dog" ||
                    nextWord.word=="dog" ||
                    nextWord.word=="daughter" ||
                    nextWord.word=="Daughter" ||
                    nextWord.word=="Son" ||
                    nextWord.word=="son" ||
                    nextWord.word=="Cat" ||
                    nextWord.word=="cat" 
                    ) {
                      familyMems.push(nextWord.word);
                }
            }
        }

        // add to other cases (multiple sentences, etc)

        comments.forEach(function(currentComment, commentIndex) {
            coreNLP.process(currentComment.data.body, function(err, result) {
            if (Array.isArray(result.document.sentences.sentence)) {
              result.document.sentences.sentence.forEach(function(x) {
                  sentenceCounter = sentenceCounter + 1;
                  if (Array.isArray(x.tokens.token)) {
                      x.tokens.token.forEach(function(y, index) {
                          if (index < x.tokens.token.length -1) {
                            getFamilyMembers(y, x.tokens.token[index+1]);
                          }
                        
                          //checking and counting sentiment if its an adjective
                          if (y.word == 'I' || y.word == 'i') {
                              if (index < x.tokens.token.length-2) {
                                  if ((x.tokens.token[index+1].lemma == "be") && (x.tokens.token[index+2].lemma != "not")) {
                                      // console.log("\n\n"+currentComment.data.body + "\n\n")
                                      FindYouAre(x.parsedTree, parseInt(x.tokens.token[index+1].$.id), false);
                                      //console.log("finished finding you are's");
                                  }
                              }
                          }
                          else {
                            isFinished = true;
                          }
                          getSentimentData(y, currentComment.data.body);
                      });
                  }
                  else {
                    getSentimentData(x.tokens.token, currentComment.data.body);
                  }
              });
            }
            else {
                sentenceCounter = sentenceCounter + 1;

                if (Array.isArray(result.document.sentences.sentence.tokens.token)) {
                    result.document.sentences.sentence.tokens.token.forEach(function(z) {
                        getSentimentData(z, currentComment.data.body);
                    });
                }

                else {
                    getSentimentData(result.document.sentences.sentence.tokens.token, currentComment.data.body);
                }

                isFinished = true;
            }
            
            if (isFinished) {
                counter++;
                isFinished = false;

                if (counter == comments.length) {
                    if (descriptorSet.length > 0) {
                        descriptorSet.forEach(function(identifier, identifierIndex) {
                            console.log("before filter: " + identifier + "\n");
                            coreNLP.process(identifier, function(err, tokenziedIdentifier) {
                                if (Array.isArray(tokenziedIdentifier.document.sentences.sentence.tokens.token)) {
                                    if (tokenziedIdentifier.document.sentences.sentence.tokens.token[0].POS == "DT") {
                                        console.log("after filter: " + identifier.substring(parseInt(tokenziedIdentifier.document.sentences.sentence.tokens.token[0].CharacterOffsetEnd)+1) + "\n");
                                        filteredArray.push(identifier.substring(parseInt(tokenziedIdentifier.document.sentences.sentence.tokens.token[0].CharacterOffsetEnd)+1));
                                    }
                                    else {
                                        filteredArray.push(identifier);
                                    }
                                }
                                if (identifierIndex == (descriptorSet.length-1)) {
                                    console.log("\n\n" + "DONE!" + "\n\n");
                                    callback(filteredArray);
                                    return;
                                }
                            });
                        });
                    }
                    else {
                        console.log("\n\n" + "EMPTY!" + "\n\n");
                        callback(filteredArray);
                        return;
                    }
                }
            }
        });
      });
    }

    function timeBasedData(comments, callback) {
        var currentCommentScore = 0,
            currentPostCount    = 0;

        function checkIfDateExists(dates, currentMonth, currentYear) {
            var index = -1;
            dates.forEach(function(date, i) {
              if (date.month == currentMonth && date.year == currentYear) {
                index = i;
              }
            });
            return index;
        }

        var monthNames = ["January", "February", "March", "April", "May", "June",
                          "July", "August", "September", "October", "November", "December"];

        date = new Date(comments[0].data.created_utc * 1000);
        currentMonth = date.getMonth();
        currentYear = date.getFullYear();
        
        comments.forEach(function(currentComment, item) {
            if (currentComment.data.created_utc < earliestComment) {
              earliestComment = currentComment.data.created_utc;
            }

            date = new Date(currentComment.data.created_utc * 1000);

            if (date.getMonth() == currentMonth && date.getFullYear() == currentYear) {
                currentCommentScore += currentComment.data.score;
                currentPostCount++;
            }
            else if (checkIfDateExists(monthData, monthNames[currentMonth], currentYear) > -1) {
                var i = checkIfDateExists(monthData, monthNames[currentMonth], currentYear);
                monthData[i].commentKarmaForMonth += currentComment.data.score;
                monthData[i].postsForMonth++;
                currentMonth = date.getMonth();
                currentYear = date.getFullYear();
                currentCommentScore = 0;
                currentPostCount = 0;
            }
            else {
              console.log("\n\nCURRENT DATE: " + monthNames[currentMonth] + currentYear + " with " + currentCommentScore + " and " + currentPostCount);
              console.log("\nDOESN'T MATCH! NEW DATE: " + monthNames[date.getMonth()] + date.getFullYear());
              monthData.push({
                                  month: monthNames[currentMonth],
                                  date: ("0" + date.getDate()).slice(-2),
                                  year: currentYear,
                                  commentKarmaForMonth: currentCommentScore,
                                  postsForMonth: currentPostCount
                                });
              currentMonth = date.getMonth();
              currentYear = date.getFullYear();
              // console.log("\nCurrent Month: " + currentMonth + "\nCurrent Year: " + currentYear + "\nCurrent Comment Score: " + currentCommentScore + "\nCurrent Post Count: " + currentPostCount + "\n");
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

            if (item == (comments.length-1)) {
                callback();
            }
        });
    }

    function getMetadata (currentComment) {
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
    }
    
    function getEstimatedRegion() {
        //Highest activity hours: 7-9PM, lowest: 4-6AM
        var maxActivity, minActivity, maxActivityHours, minActivityHours, maxActivityAvg, minActivityAvg;

        function getAllIndexes(arr, val) {
            var indexes = [], i;

            for(i = 0; i < arr.length; i++) {
                if (arr[i] === val)
                  indexes.push(i);
            }

            return indexes;
        }

        maxActivityHours = getAllIndexes(hourTracker, Math.max.apply(Math, hourTracker));
        minActivityHours = getAllIndexes(hourTracker, Math.min.apply(Math, hourTracker));

        var maxSum = maxActivityHours.reduce(function(a, b) { return a + b; });
        maxActivity = maxSum / maxActivityHours.length; //get max avg value hour from array
        var minSum = minActivityHours.reduce(function(a, b) { return a + b; });
        minActivity = minSum / minActivityHours.length; //get min


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
    }

     getUserComments(function(allComments) { /* get all user comments */
        allComments.forEach(function(commentSlice) {
          commentSlice.data.children.forEach(function(currentComment) {
              userComments.push(currentComment);
              getMetadata(currentComment);

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

        getNLPData(userComments, function(youAre) {
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
            userData.availableFrom = earliestComment*1000;

            adjPerVN = 100*((adjVN)/(adjVN+adjN+adjP+adjVP));
            adjPerN = 100*((adjN)/(adjVN+adjN+adjP+adjVP));
            adjPerP = 100*((adjP)/(adjVN+adjN+adjP+adjVP));
            adjPerVP = 100*((adjVP)/(adjVN+adjN+adjP+adjVP));

            if (negativeSentenceCount > 0 && sentenceCounter > 0) {
                userData.negativePercentage = (negativeSentenceCount / sentenceCounter).toPrecision(3) * 100;
            }

            userData.negativeExample = negativeComments;
            userData.veryNegativeAdjs = adjVN;
            userData.negativeAdjs = adjN;
            userData.positiveAdjs = adjP;
            userData.veryPositiveAdjs = adjVP;
            userData.vnEx = veryNegAdEx;
            userData.nEx = negAdEx;
            userData.pEx = posAdEx;
            userData.vpEx = veryPosAdEx;

            if (adjPerVN)
              userData.vnPer = adjPerVN.toPrecision(3);
            if (adjPerN)
              userData.nPer = adjPerN.toPrecision(3);
            if (adjPerP)
              userData.pPer = adjPerP.toPrecision(3);
            if (adjPerVP)
              userData.vpPer = adjPerVP.toPrecision(3);

            userData.descriptions = youAre;
            userData.familyMembers = familyMems;

            var comLengthSum = commentLengths.reduce(function(a, b) { return a + b; });
            userData.avgCommentLength = comLengthSum / commentLengths.length; //store average length

            for (var i = 0; i < hourTracker.length; i++) { //store comment hourly data
              userData.hour.push({
                hour: i,
                postsForHour: hourTracker[i],
                commentKarmaForHour: hourScorer[i]
              });
            }

            for (var i = 0; i < dayTracker.length; i++) { //store comment hourly data
              userData.day.push({
                day: i,
                postsForDay: dayTracker[i],
                commentKarmaForDay: dayScorer[i]
              });
            }
            timeBasedData(userComments, function() {
                userData.dateData = monthData; // fix

                getKarmaAndDate(function(scores) { /* get total karma scores and creation timestamp */
                  userData.karma.totalCommentScore = scores.comments;
                  userData.karma.totalLinkScore = scores.submissions;
                  userData.creationTime = (scores.created)*1000;

                  getTopComment(function(topComment) {
                    userData.topComment = topComment;
                    getTopSubmission(function(topSubmission) {
                      userData.topSubmission = topSubmission;
                      callback(userData);
                      return;
                    });
                  });
                });
            });
            // userData.region = region;  
        });
      });
}

// '/api/reddit/:username/'
export function checkUser (req, res) {
  findUser(req.params.username).then(function(userData) {
      if (userData != null) { // add our time constraint
          return res.send(userData);
      }

      else {
        username = req.params.username;
        createUser(function(user) {
          console.log("\n\nSaving.\n\n");
          saveUser(user);
          return res.send(user);
        });
      }
  });
}

export function getKarmaAndDate (callback) {
  reddit('/user/' + username + '/about/').get().then(function(response) {
    var details = {};
    details.comments = parseInt(response.data.comment_karma);
    details.submissions = parseInt(response.data.link_karma);
    details.created = parseInt(response.data.created_utc);
    callback(details);
    return;
  });
  // how does outer return work
}

export function getUserComments (callback) {
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
  var i = 1;

  reddit('/user/' + username + '/comments/').get({ limit: 100 }).then(function(firstSlice) {
    if (firstSlice.data.children.length == 0) {
      return;
    }
    slices.push(firstSlice);
    loop(firstSlice, firstSlice.data.children[firstSlice.data.children.length-1].data.name);
  });  
}

export function getTopComment (callback) {
      reddit('/user/' + username + '/comments/').get({
        limit: 1,
        sort: 'top'
      }).then(function(response) {
        var comment = {};
        comment.score = parseInt(response.data.children[0].data.score);
        comment.body = response.data.children[0].data.body.toString();
        comment.subreddit = response.data.children[0].data.subreddit.toString();
        comment.permalink = 'https://www.reddit.com/r/' + response.data.children[0].data.subreddit.toString() + "/comments/" + response.data.children[0].data.link_id.toString().replace('t3_','') + "/_/" + response.data.children[0].data.id.toString();
        callback(comment);
        return;
      });
}

export function getTopSubmission (callback) {
    reddit('/user/' + username + '/submitted/').get({ /* need to add raw json later */
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
        return;
      });
}

/* ======================================================================== */
/* ======================================================================== */
/* ===============================NOT USED================================= */
/* ======================================================================== */

export function getAbout (req, res) {
    reddit('/user/' + req.params.username + '/about/').get().then(function(response) {
    var details = {};
    details.comments = parseInt(response.data.comment_karma);
    details.submissions = parseInt(response.data.link_karma);
    details.created = parseInt(response.data.created_utc);
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