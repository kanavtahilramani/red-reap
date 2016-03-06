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

        positivity(userComments, function(sentenceCount, negativeSentenceCounts, negativeSample, vnAdjs, nAdjs, pAdjs, vpAdjs, exVN, exN, exP, exVP, vnPerin, nPerin, pPerin, vpPerin, iAm, membersOfFamily) {
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
            userData.descriptions = iAm;
            userData.familyMembers = membersOfFamily;

            getKarmaAndDate(req, res, function(scores) { /* get total karma scores and creation timestamp */
              userData.karma.totalCommentScore = scores.comments;
              userData.karma.totalLinkScore = scores.submissions;
              userData.creationTime = (scores.created)*1000;

              getTopComment(req, res, function(topComment)
              {
                userData.topComment = topComment;
                getTopSubmission(req, res, function(topSubmission)
                {
                  userData.topSubmission = topSubmission;
                  callback(userData);
                });
              });
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
        nonNounFound = false,
        descriptorNounFound = false,
        descriptorNonNounFound = false,
        familyMems = [],
        descriptorSet = [],
        UCPadverbExists = false,
        isFinished = false,
        numCalls = 0,
        numComments = 0,
        currentCommentIndex = 0;

        //start by using parsedTree as tier for top call to FindYouAre
        function FindYouAre(tier, toBeId, onTheHunt){
          numCalls++;
          //console.log("FindYouAre is called");
          if (tier.type == "NP " && onTheHunt){
            //console.log("found NP and onTheHunt");
            //if i have grandchildren, call on my children
            
             //console.log("Non terminal NP, calling on children");
                tier.children.forEach(function(childTwo){
                    FindYouAre(childTwo, toBeId, true);
                });
                numCalls--;
                if (numCalls === 0 && currentCommentIndex == numComments-1) {
                  isFinished = true;
                  return;
                }
                return;
            }

             if (tier.type == "NP" && onTheHunt){
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
              console.log("\n\n" + descriptor + "\n\n");
              descriptorSet.push(descriptor);              
              descriptor = "";
              descriptorNounFound = false;
              descriptorNonNounFound = false;
              isFinished = true;
              numCalls--;
              if (numCalls === 0 && currentCommentIndex == numComments-1) {
                isFinished = true;
                return;
              }
              return;
              }

          

          
          if ((tier.type == "VP") && (tier.children[0].children[0].id == toBeId)){
             console.log("found VP with matching id");
              tier.children.forEach(function(child){
                FindYouAre(child, toBeId, true);
              });
              numCalls--;
              if (numCalls === 0 && currentCommentIndex == numComments-1) {
                isFinished = true;
                return;
              }
              return;
          }



          
          else if (tier.children[0].hasOwnProperty('children')){
              tier.children.forEach(function(childThree){
                FindYouAre(childThree, toBeId, false);
              });
              numCalls--;
              if (numCalls === 0 && currentCommentIndex == numComments-1) {
                isFinished = true;
                return;
              }
              return;
          }

          else{
            numCalls--;
            if (numCalls === 0 && currentCommentIndex == numComments-1) {
              isFinished = true;
              return;
            }
            return;  
          }
        }

        numComments = comments.length;

    comments.forEach(function(currentComment, i) {
        currentCommentIndex = i;
        coreNLP.process(currentComment, function(err, result) {
          
          if (Array.isArray(result.document.sentences.sentence)) {
            result.document.sentences.sentence.forEach(function(x) {
                sentenceCounter = sentenceCounter + 1;
                if (Array.isArray(x.tokens.token)) {
                    x.tokens.token.forEach(function(y, index) {

                      //family member detection
                      if (index < x.tokens.token.length -1){  
                        if (y.word == "My" || y.word == "my"){
                          if (x.tokens.token[index+1].word=="mom" ||
                              x.tokens.token[index+1].word=="Mom" ||
                              x.tokens.token[index+1].word=="Dad" ||
                              x.tokens.token[index+1].word=="dad" ||
                              x.tokens.token[index+1].word=="sister" ||
                              x.tokens.token[index+1].word=="Sister" ||
                              x.tokens.token[index+1].word=="brother" ||
                              x.tokens.token[index+1].word=="Brother" ||
                              x.tokens.token[index+1].word=="Dog" ||
                              x.tokens.token[index+1].word=="dog" ||
                              x.tokens.token[index+1].word=="daughter" ||
                              x.tokens.token[index+1].word=="Daughter" ||
                              x.tokens.token[index+1].word=="Son" ||
                              x.tokens.token[index+1].word=="son" ||
                              x.tokens.token[index+1].word=="Cat" ||
                              x.tokens.token[index+1].word=="cat" 
                              ){
                              familyMems.push(x.tokens.token[index+1].word);

                            }
                        } 
                      }





                        //checking and counting sentiment if its an adjective
                        if (y.word == 'I' || y.word == 'i') {
                            if (index < x.tokens.token.length-2) {
                                if ((x.tokens.token[index+1].lemma == "be") && (x.tokens.token[index+2].lemma != "not")) {
                     

                                    console.log("\n\n"+currentComment + "\n\n")

                                    FindYouAre(x.parsedTree, parseInt(x.tokens.token[index+1].$.id), false);

                                    //console.log("finished finding you are's");

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
          //callback(sentenceCounter, negativeSentenceCount, negativeComments, adjVN, adjN, adjP, adjVP, veryNegAdEx, negAdEx, posAdEx, veryPosAdEx, adjPerVN, adjPerN, adjPerP, adjPerVP);
          //return;

          var temporaryString = "",
          filteredArray = [];
          if (descriptorSet.length > 0 && isFinished) {
            descriptorSet.forEach(function(currentExample, ix){
                console.log("descriptor:" + currentExample); 
                coreNLP.process(currentExample, function(err, currentPos){


                  if (Array.isArray(currentPos.document.sentences.sentence.tokens.token)){

                      if (currentPos.document.sentences.sentence.tokens.token[0].POS == "DT"){
                  
                       filteredArray.push(currentExample.substring(parseInt(currentPos.document.sentences.sentence.tokens.token[0].CharacterOffsetEnd)+1));
                 
                       }

                  if (currentPos.document.sentences.sentence.tokens.token[currentPos.document.sentences.sentence.tokens.token.length-1].POS != "NN" && currentPos.document.sentences.sentence.tokens.token[currentPos.document.sentences.sentence.tokens.token.length-1].POS != "NNP" && currentPos.document.sentences.sentence.tokens.token[currentPos.document.sentences.sentence.tokens.token.length-1].POS != "NNPS" && currentPos.document.sentences.sentence.tokens.token[currentPos.document.sentences.sentence.tokens.token.length-1].POS != "NNS"){

                     // descriptorSet.splice(ix, 1);
                     }

                  }
                
                  
                  //console.log("Descriptor: " + currentExample + "a\n");
                    



                    if (ix == descriptorSet.length-1){
                        filteredArray.forEach(function(thisWord, indexTwo){
                          console.log("After: " + thisWord + "\n");
                          filteredArray.forEach(function(otherWords,j){
                              if (otherWords==thisWord && j!= indexTwo){
                                filteredArray.splice(j, 1);
                              }
                          });
                          if (indexTwo==filteredArray.length-1){
                            callback(sentenceCounter, negativeSentenceCount, negativeComments, adjVN, adjN, adjP, adjVP, veryNegAdEx, negAdEx, posAdEx, veryPosAdEx, adjPerVN, adjPerN, adjPerP, adjPerVP, filteredArray, familyMems);
                          return;
                          }
                        });



                        }
                  });
                });
              }
              else if (descriptorSet.length <= 0 && isFinished) {
                console.log("returning from positivity");
                callback(sentenceCounter, negativeSentenceCount, negativeComments, adjVN, adjN, adjP, adjVP, veryNegAdEx, negAdEx, posAdEx, veryPosAdEx, adjPerVN, adjPerN, adjPerP, adjPerVP, filteredArray, familyMems);
                return;
              }
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

export function getTopComment (req, res, callback) {
      reddit('/user/' + req.params.username + '/comments/').get({
        limit: 1,
        sort: 'top'
      }).then(function(response) {
        var comment = {};
        comment.score = parseInt(response.data.children[0].data.score);
        comment.body = response.data.children[0].data.body.toString();
        comment.subreddit = response.data.children[0].data.subreddit.toString();
        comment.permalink = 'https://www.reddit.com/r/' + response.data.children[0].data.subreddit.toString() + "/comments/" + response.data.children[0].data.link_id.toString().replace('t3_','') + "/_/" + response.data.children[0].data.id.toString();
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

/* ======================================================================== */
/* ======================================================================== */
/* ===============================NOT USED================================= */
/* ======================================================================== */

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