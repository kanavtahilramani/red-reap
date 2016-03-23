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
    var isSelfPostHelper, isSelfPost, isFlaired, isDistinguished, comLevel, region;
    var commentLink, submittedLink;

    var userComments = [];
    var userSubmitted = [];
    var monthData = [];
    var monthDataSubmitted = [];

    var earliestComment = Number.MAX_VALUE;
    var earliestSubmitted = Number.MAX_VALUE;

    var date, date2, currentMonth, currentYear, currentHour, currentDay;
    var totalCommentCount  = 0, 
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

    var currentPostLength = 0,
        totalSubmittedCount = 0,
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
        subredditSentiment = [];

    var done = false;

    var monthNames = ["January", "February", "March", "April", "May", "June",
                          "July", "August", "September", "October", "November", "December"];

    var hourTracker = new Array(24+1).join('0').split('').map(parseFloat), //24-wide array of 0s
        hourScorer = new Array(24+1).join('0').split('').map(parseFloat), //24-wide array of 0s
        dayTracker = new Array(7+1).join('0').split('').map(parseFloat), //7-wide array of 0s
        dayScorer = new Array(7+1).join('0').split('').map(parseFloat); //7-wide array of 0s

    var hourTracker2 = new Array(24+1).join('0').split('').map(parseFloat), //24-wide array of 0s
        hourScorer2 = new Array(24+1).join('0').split('').map(parseFloat), //24-wide array of 0s
        dayTracker2 = new Array(7+1).join('0').split('').map(parseFloat), //7-wide array of 0s
        dayScorer2 = new Array(7+1).join('0').split('').map(parseFloat); //7-wide array of 0s

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
      function FindYouAre(tier, toBeId, onTheHunt, thisComment) {
        numCalls++;
        //console.log("\n\nType is: __" + tier.type + "__");
       

         if (tier.type == "NP" && onTheHunt) {
         //console.log("\n\n"+thisComment.data.body + "\n\n")

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

          else if ((tier.type == "VP") && (tier.children[0].children[0].id == toBeId)){
              //console.log("\n\nfound VP with matching id\n\n");
              tier.children.forEach(function(child){
                FindYouAre(child, toBeId, true, thisComment);
              });
              numCalls--;

              if (numCalls === 0) {
                isFinished = true;
                return;
              }
              else
                return;
          }
          else if (tier.children[0].type == "NP" && onTheHunt) {
              tier.children.forEach(function(childTwo) {
                  FindYouAre(childTwo, toBeId, true, thisComment);
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
                FindYouAre(childThree, toBeId, false, thisComment);
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






      //var subredditSentiment = []; //store sentiment objects, one per subreddit
      var tempSubSentiment;    
      var subIdFound = false;
      function storeSentimentForSub (currentSentence, currentSubId, currentSub){
        //console.log("\n\n");
        //console.log("curSub: " + currentSub + " == curSubId: " + currentSubId + " == curSentSent: " + currentSentence.$.sentimentValue);
        subIdFound = false;

        subredditSentiment.forEach(function(eachObj){
          if (eachObj.subid == currentSubId){
            subIdFound = true;
          }
        });
        

        //if an object with this sub_id exists within subredditSentiment, update its values with this sentence's sentiment
        if (subIdFound){
          subredditSentiment.forEach(function(sentimentObj){
            //found the match so update the sentiment
            if (sentimentObj.subid == currentSubId){
                if (currentSentence.$.sentimentValue == "1"){
                  sentimentObj.negativeCount = sentimentObj.negativeCount + 1;
                }
                if (currentSentence.$.sentimentValue == "2"){
                  sentimentObj.neutralCount = sentimentObj.neutralCount + 1; 
                }
                if (currentSentence.$.sentimentValue == "3"){
                  sentimentObj.positiveCount = sentimentObj.positiveCount + 1;
                }
            }
          });

        }

        //if the object does not exist, create it within subredditSentiment
        else{
            tempSubSentiment = {sub: currentSub, subid: currentSubId, negativeCount: 0, neutralCount: 0, positiveCount: 0, total: 0, negPer: 0, neuPer:0, posPer: 0};
      
            if (currentSentence.$.sentimentValue == "1"){
              tempSubSentiment.negativeCount = tempSubSentiment.negativeCount + 1;
            }
            if (currentSentence.$.sentimentValue == "2"){
              tempSubSentiment.neutralCount = tempSubSentiment.neutralCount + 1; 
            }
            if (currentSentence.$.sentimentValue == "3"){
              tempSubSentiment.positiveCount = tempSubSentiment.positiveCount + 1;
            }

            subredditSentiment.push(tempSubSentiment);   
        }
      }




        comments.forEach(function(currentComment, commentIndex) {
            coreNLP.process(currentComment.data.body, function(err, result) {
            if (Array.isArray(result.document.sentences.sentence)) {
              result.document.sentences.sentence.forEach(function(x) {

                  //call sentenceSentiment storage
                  //console.log(currentComment.data.body+"\n\n");
                  //if (currentComment.data.subreddit_id == "t5_2zume"){
                      //console.log("\n\n");
                      //console.log(currentComment.data.subreddit);
                      //console.log(currentComment.data.body);
                  //}
                  storeSentimentForSub(x, currentComment.data.subreddit_id, currentComment.data.subreddit);
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
                                      //console.log("\n\n"+currentComment.data.body + "\n\n")
                                      FindYouAre(x.parsedTree, parseInt(x.tokens.token[index+1].$.id), false, currentComment);
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
                        // console.log("\n\nDESCRIPTOR SET LENGTH = " + descriptorSet.length);
                        // descriptorSet.forEach(function(identifier, identifierIndex) {
                        //    var noVerbs = true, 
                        //    tempWord = "";
                        //    coreNLP.process(identifier, function(err, tokenziedIdentifier) {
                        //         if (Array.isArray(tokenziedIdentifier.document.sentences.sentence.tokens.token)) {
                        //           //forEach loop to check if the ddescriptor contains any verbs, if it does we do not want it
                        //           tokenziedIdentifier.document.sentences.sentence.tokens.token.forEach(function(indivWord, indyindy){
                        //              // console.log("CURRENTLY ON DESCRIPTOR " + identifierIndex+ " WORD IN DESCRIPTOR: " + indyindy);
                        //              // console.log("before filter: " + identifier + "\n");
                                   
                        //               coreNLP.process(indivWord.word, function(err,processedIndivWord){
                        //                 console.log("CURRENTLY ON DESCRIPTOR " + identifierIndex+ " WORD IN DESCRIPTOR: " + indyindy);
                        //                 console.log("before filter: " + identifier);
                        //                 console.log("current word: " + processedIndivWord.document.sentences.sentence.tokens.token.word);
                        //                 console.log("current POS: " + processedIndivWord.document.sentences.sentence.tokens.token.POS)
                        //                   //console.log("processedIndivWord.word: "+ processedIndivWord.document.sentences.sentence.tokens.token.word);
                        //                   if (processedIndivWord.document.sentences.sentence.tokens.token.POS == "VB" || processedIndivWord.document.sentences.sentence.tokens.token.POS == "VBD" || processedIndivWord.document.sentences.sentence.tokens.token.POS == "VBG" || processedIndivWord.document.sentences.sentence.tokens.token.POS == "VBN" || processedIndivWord.document.sentences.sentence.tokens.token.POS == "VBP" || processedIndivWord.document.sentences.sentence.tokens.token.POS == "VBZ"){
                        //                     noVerbs = false;
                        //                   }
                        //                   else if (processedIndivWord.document.sentences.sentence.tokens.token.POS != "DT"){
                        //                    // console.log("\nadding: " + processedIndivWord.document.sentences.sentence.tokens.token.word + " to " + tempWord+"\n");
                        //                     tempWord = tempWord + " " + processedIndivWord.document.sentences.sentence.tokens.token.word;
                        //                   }
                        //                   console.log("current tempWord: " + tempWord);
                        //                   console.log("noVerbs is: " + noVerbs+ "\n");
                        //                   if (indyindy == (tokenziedIdentifier.document.sentences.sentence.tokens.token.length-1)) {
                        //                     if (noVerbs){
                        //                       console.log("=================after filter: "+ tempWord);
                        //                       filteredArray.push(tempWord);
                        //                     }
                        //                     tempWord = "";
                        //                     noVerbs = true;

                        //                     if (identifierIndex == (descriptorSet.length-1)) {
                        //                       console.log("\n\n" + "DONE!" + "\n\n");
                        //                       callback(filteredArray);
                        //                       return;
                        //                     }
                        //                   }

                        //               });
     
                        //           });
                        //         }
                        //         else if (identifierIndex == (descriptorSet.length-1)) {
                        //             console.log("CURRENTLY ON DESCRIPTOR: " + identifierIndex + " BUT NOT ARRAY! DONE DONE DONE");
                        //             //console.log("\n\n" + "DONE!" + "\n\n");
                        //             callback(filteredArray);
                        //             return;
                        //         }
                        //     });
                        // });
                          descriptorSet.forEach(function(identifier, identifierIndex) {
                            //console.log("before filter: " + identifier + "\n");
                            coreNLP.process(identifier, function(err, tokenziedIdentifier) {
                                if (Array.isArray(tokenziedIdentifier.document.sentences.sentence.tokens.token)) {
                                    if (tokenziedIdentifier.document.sentences.sentence.tokens.token[0].POS == "DT") {
                                        //console.log("after filter: " + identifier.substring(parseInt(tokenziedIdentifier.document.sentences.sentence.tokens.token[0].CharacterOffsetEnd)+1) + "\n");
                                        filteredArray.push(identifier.substring(parseInt(tokenziedIdentifier.document.sentences.sentence.tokens.token[0].CharacterOffsetEnd)+1));
                                    }
                                    else {
                                        filteredArray.push(identifier);
                                    }
                                }
                                if (identifierIndex == (descriptorSet.length-1)) {
                                    //console.log("\n\n" + "DONE!" + "\n\n");
                                    callback(filteredArray);
                                    return;
                                }
                            });
                        });
                    }
                    else {
                        console.log("\n\n" + "EMPTY!" + "\n\n");
                        callback(descriptorSet);
                        return;
                    }
                }
            }
        });
      });
    }

    function timeBasedData(comments, callback) {
        var currentCommentScore = 0,
            currentPostCount = 0;

        function checkIfDateExists(dates, currentMonth, currentYear) {
            var index = -1;
            dates.forEach(function(date, i) {
              if (date.month == currentMonth && date.year == currentYear) {
                index = i;
              }
            });
            return index;
        }

        date = new Date(comments[0].data.created_utc * 1000);
        currentMonth = date.getMonth();
        currentYear = date.getFullYear();
        
        comments.forEach(function(currentComment, item) {
           
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
              //console.log("\n\nCURRENT DATE: " + monthNames[currentMonth] + currentYear + " with " + currentCommentScore + " and " + currentPostCount);
              //console.log("\nDOESN'T MATCH! NEW DATE: " + monthNames[date.getMonth()] + date.getFullYear());
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


            if (item == (comments.length-1)) {
                callback();
            }
        });
    }

    function timeBasedDataSub(submitted, callback) {

        var currentSubmittedScore = 0,
            currentSubPostCount = 0;
        
        function checkIfDateExists(dates, currentMonth, currentYear) {
            var index = -1;
            dates.forEach(function(date2, i) {
              if (date2.month == currentMonth && date2.year == currentYear) {
                index = i;
              }
            });
            return index;
        }

        date2 = new Date(submitted[0].data.created_utc * 1000);
        currentMonth = date2.getMonth();
        currentYear = date2.getFullYear();
        
        submitted.forEach(function(currentSubmitted, item) {
           
            date2 = new Date(currentSubmitted.data.created_utc * 1000);

            if (date2.getMonth() == currentMonth && date2.getFullYear() == currentYear) {
                currentSubmittedScore += currentSubmitted.data.score;
                currentSubPostCount++;
            }
            else if (checkIfDateExists(monthDataSubmitted, monthNames[currentMonth], currentYear) > -1) {
                var i = checkIfDateExists(monthDataSubmitted, monthNames[currentMonth], currentYear);
                monthDataSubmitted[i].linkKarmaForMonth += currentSubmitted.data.score;
                monthDataSubmitted[i].postsForMonth++;
                currentMonth = date2.getMonth();
                currentYear = date2.getFullYear();
                currentSubmittedScore = 0;
                currentSubPostCount = 0;
            }
            else {
              //console.log("\n\nCURRENT DATE: " + monthNames[currentMonth] + currentYear + " with " + currentSubmittedScore + " and " + currentSubPostCount);
              //console.log("\nDOESN'T MATCH! NEW DATE: " + monthNames[date2.getMonth()] + date2.getFullYear());
              monthDataSubmitted.push({
                                  month: monthNames[currentMonth],
                                  date: ("0" + date2.getDate()).slice(-2),
                                  year: currentYear,
                                  linkKarmaForMonth: currentSubmittedScore,
                                  postsForMonth: currentSubPostCount
                                });
              currentMonth = date2.getMonth();
              currentYear = date2.getFullYear();
              // console.log("\nCurrent Month: " + currentMonth + "\nCurrent Year: " + currentYear + "\nCurrent Comment Score: " + currentCommentScore + "\nCurrent Post Count: " + currentPostCount + "\n");
              currentSubmittedScore = 0;
              currentSubPostCount = 0;
            }


            currentHour = date2.getHours(); //get UTC hour submitted was posted
            hourTracker2[currentHour]++; //increment count for that hour
            hourScorer2[currentHour] += currentSubmitted.data.score; //add submitted's score to running total for hour

            currentDay = date2.getDay(); //get day 0-6
            dayTracker2[currentDay]++; //increment count for that day
            dayScorer2[currentDay] += currentSubmitted.data.score; //add submitted's score to running total for day


            if (item == (submitted.length-1)) {
                callback();
            }
        });
    }

    function getMetadata (currentComment) {
        
        totalCommentCount++; //track total number of comments

        if (currentComment.data.created_utc < earliestComment) {
            earliestComment = currentComment.data.created_utc;
        }

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
        if (currentComment.data.author_flair_css_class != null) //tracking comments with flair on them
        {
          totalFlaired++;
          isFlaired = 1;
        }
        else
        {
          isFlaired = 0;
        }
        if(currentComment.data.distinguished != null) //tracking distinguished comments, i.e. comments that have a moderator flair
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
    }

    function getMetadataSub (currentSubmitted) {

        totalSubmittedCount++; //track total number of Submitted

        if (currentSubmitted.data.created_utc < earliestSubmitted) {
          earliestSubmitted = currentSubmitted.data.created_utc;
        }

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
        if (currentSubmitted.data.link_flair_css_class != null) //if link has flair
        {
          totalSubmittedFlaired++;
          isFlaired = 1;
        }
        else
        {
          isFlaired = 0;
        }
        if(currentSubmitted.data.distinguished != null) //if distinguished as mod post
        {
          totalSubmittedDistinguished++;
          isDistinguished = 1;
        }
        else
        {
          isDistinguished = 0;
        }

        if (currentSubmitted.data.selftext_html != null) //check if submission is self post or link
        {
          currentPostLength = currentSubmitted.data.selftext_html.toString().length; //get details on self post
          totalSubmittedWords += Math.round(currentPostLength / 5)
          submittedLengths.push(currentPostLength);
        }
        else
        {
          currentPostLength = 0;
        }

        submittedSubreddits.push(currentSubmitted.data.subreddit.toString()); //store subreddit Submitted is in
        submittedLink = currentSubmitted.data.url.toString();
        
        isSelfPost = currentSubmitted.data.is_self; //track if self post
        if (isSelfPost)
        {
          totalSelfPosts++;
        }

        totalCommentsOnSubmitted += currentSubmitted.data.num_comments; //others' comments on user's submissions
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
        //userData.region = region; 
    }

      getUserComments(function(allComments) { /* get all user comments */
        allComments.forEach(function(commentSlice) {
          commentSlice.data.children.forEach(function(currentComment) {
              userComments.push(currentComment);
              getMetadata(currentComment);

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

        getNLPData(userComments, function(youAre) {
            userData.totalComments = totalCommentCount;
            userData.genCommentData.editingData.totalEditedComments = totalEditedCommentCount;
            userData.genCommentData.editingData.avgEditTime = totalEditedTimeRange / totalEditedCommentCount; //this is in seconds
            editedTimes.sort(); //sort lowest to highest
            userData.genCommentData.editingData.medEditTime = editedTimes[Math.floor(editedTimes.length/2)]; //store median time
            userData.genCommentData.commentTotals.nsfwComments = totalnsfw;
            userData.genCommentData.commentTotals.controversialComments = totalControversial;
            userData.genCommentData.commentTotals.gildedComments = totalCommentsGilded;
            userData.genCommentData.commentTotals.totalGilds = totalGilds;
            userData.genCommentData.commentTotals.totalWords = totalWords;
            userData.genCommentData.commentTotals.totalFlaired = totalFlaired;
            userData.genCommentData.commentTotals.totalDistinguished = totalDistinguished;
            userData.genCommentData.commentTotals.totalReplyComments = totalReplyComments;
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

            //filter subredditSentiment to only contain the top 5 most frequently contributed to subreddits
            //sort array then take the top 5, if less than equal to 5 elements take the whole thing
            //selection sort
            subredditSentiment.forEach(function(item, outIndex){ 
                //set minimum to this position
                var min = outIndex;
                

                //check the rest of the array to see if anything is smaller
                subredditSentiment.forEach(function(innerItem, inIndex){ 
                    if (inIndex >= outIndex+1){
                        if ((subredditSentiment[min].positiveCount + subredditSentiment[min].neutralCount + subredditSentiment[min].negativeCount) < (innerItem.positiveCount + innerItem.neutralCount + innerItem.negativeCount)){
                            min = inIndex;
                        }
                    }
                    if (inIndex == subredditSentiment.length-1){
                        if (outIndex != min){
                            var tempSub = "",
                            tempSubid = "",
                            tempNegativeCount = 0,
                            tempNeutralCount = 0,
                            tempPositiveCount = 0,
                            tempNegPer = 0,
                            tempNeuPer = 0,
                            tempPosPer = 0,
                            tempTotal = 0;

                            //set temp = min
                            tempSub = subredditSentiment[min].sub;
                            tempSubid = subredditSentiment[min].subid;
                            tempNegativeCount = subredditSentiment[min].negativeCount;
                            tempNeutralCount = subredditSentiment[min].neutralCount;
                            tempPositiveCount = subredditSentiment[min].positiveCount;
                            // tempNegPer = subredditSentiment[min].negPer;
                            // tempNeuPer = subredditSentiment[min].neuPer;
                            // tempPosPer = subredditSentiment[min].posPer;
                            // tempTotal = subredditSentiment[min].total;
                            //console.log(tempNegPer + " " + tempNeuPer + " " + tempPosPer + " " + tempTotal);
                            //set min = i
                            subredditSentiment[min].sub = item.sub;
                            subredditSentiment[min].subid = item.subid;
                            subredditSentiment[min].negativeCount = item.negativeCount;
                            subredditSentiment[min].neutralCount = item.neutralCount ;
                            subredditSentiment[min].positiveCount = item.positiveCount; 
                            // subredditSentiment[min].negPer = item.negPer; 
                            // subredditSentiment[min].neuPer = item.neuPer;
                            // subredditSentiment[min].posPer = item.posPer;
                            // subredditSentiment[min].total = item.total;
  
                            //set i = temp
                            item.sub = tempSub;
                            item.subid = tempSubid;
                            item.negativeCount = tempNegativeCount;
                            item.neutralCount = tempNeutralCount;
                            item.positiveCount = tempPositiveCount; 
                            // item.negPer = tempNegPer;
                            // item.neuPer = tempNeuPer;
                            // item.posPer = tempPosPer;
                            // item.total = tempTotal;
                        }

                        item.total = item.positiveCount + item.negativeCount + item.neutralCount;
                        item.negPer = ((item.negativeCount/item.total)*100).toPrecision(3);
                        item.neuPer = ((item.neutralCount/item.total)*100).toPrecision(3);
                        item.posPer = ((item.positiveCount/item.total)*100).toPrecision(3);

                        if (outIndex == subredditSentiment.length-1){
                            if (subredditSentiment.length<=5){
                                userData.sentimentBySub = subredditSentiment;
                            }
                            else{
                                var tempArray = [];
                                subredditSentiment.forEach(function(indivItem, indivIndex){
                                    if (indivIndex<=4){
                                        tempArray.push(indivItem);
                                    }
                                    if (indivIndex == subredditSentiment.length-1){
                                        //userData.sentimentBySub = tempArray;
                                        userData.sentimentBySub = tempArray;

                                    }

                                });
                            }
                        }
                    }
                });
            });

            var comLengthSum = commentLengths.reduce(function(a, b) { return a + b; });
            userData.genCommentData.avgCommentLength = comLengthSum / commentLengths.length; //store average length

            timeBasedData(userComments, function() {
                userData.dateData = monthData; // fix

                for (var i = 0; i < hourTracker.length; i++) { //store comment hourly data
                  userData.hour.push({
                    hour: i,
                    postsForHour: hourTracker[i],
                    karmaForHour: hourScorer[i]
                  });
                }

                for (var i = 0; i < dayTracker.length; i++) { //store comment hourly data
                  userData.day.push({
                    day: i,
                    postsForDay: dayTracker[i],
                    karmaForDay: dayScorer[i]
                  });
                }

                ///////////////////////////////////////////////////
                //////////////SUBMISSIONS SECTION//////////////////
                ///////////////////////////////////////////////////

                getUserSubmitted(function(allSubmitted) { /* get all user submissions */
                  allSubmitted.forEach(function(submittedSlice) {
                    submittedSlice.data.children.forEach(function(currentSubmitted) {
                        userSubmitted.push(currentSubmitted);
                        getMetadataSub(currentSubmitted);

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
                  userData.genSubmittedData.submittedTotals.nsfwSubmitted = totalSubmittednsfw;
                  userData.genSubmittedData.submittedTotals.controversialSubmitted = totalSubmittedControversial;
                  userData.genSubmittedData.submittedTotals.gildedSubmitted = totalSubmittedGilded;
                  userData.genSubmittedData.submittedTotals.totalSubmittedGilds = totalSubmittedGilds;
                  userData.genSubmittedData.submittedTotals.totalSubmittedWords = totalSubmittedWords;
                  userData.genSubmittedData.submittedTotals.totalSubmittedFlaired = totalSubmittedFlaired;
                  userData.genSubmittedData.submittedTotals.totalSubmittedDistinguished = totalSubmittedDistinguished;
                  userData.genSubmittedData.totalCommentsOnSubmitted = totalCommentsOnSubmitted;
                  userData.genSubmittedData.avgCommentsOnSubmitted = totalCommentsOnSubmitted / totalSubmittedCount;
                  userData.genSubmittedData.submittedTotals.totalSelfPosts = totalSelfPosts;
                  userData.genSubmittedData.submittedTotals.totalLinkPosts = totalSubmittedCount - totalSelfPosts;

                  var subLengthSum = submittedLengths.reduce(function(a, b) { return a + b; });
                  userData.genSubmittedData.avgSelfPostLength = subLengthSum / submittedLengths.length; //store average length


                  timeBasedDataSub(userSubmitted, function() {
                      userData.dateDataSub = monthDataSubmitted; //store monthly data for submissions

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
                });

                
            }); 
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

export function getUserSubmitted (callback) {
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
  var i = 1;

  reddit('/user/' + username + '/submitted/').get({ limit: 100 }).then(function(firstSlice) {
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