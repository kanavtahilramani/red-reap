'use strict';

angular.module('redreapApp')
  .factory('Subreddit', function ($http) {
    var subredditData = {};
    var subreddit2Data = {};
    return {
      getSubreddit: function (subreddit, callback) {
        $http.get('/api/reddit/subreddit/' + subreddit).then(function(data) {
            // post backend
            console.log(data);
            subredditData = data;
            callback();
            // pre frontend
        });
      },
      getSubreddit2: function(subreddit, callback) {
        $http.get('/api/reddit/subreddit2/' + subreddit).then(function(data) {
            if (data != null) {
                subreddit2Data = data;
            }
            callback();
        });
      },
      getSubData: function () {
        return subredditData;
      },
      getSubTwoData: function () {
        return subreddit2Data;
      },
      getSubredditName: function () {
        return subredditData.data.subreddit;
      },
      setAge: function(callback) {
      const oneYearInSeconds = 31556736; /* 1 year (365.24 days) */ 
      const oneMonthInSeconds = 2627942; /* 1 month (30.416 days) */
      const oneWeekInSeconds = 604800;   /* 1 week (7 days) */
      const oneDayInSeconds = 86400;     /* 1 day */
      const oneHourInSeconds = 3600;     /* 1 hour */
      const oneMinuteInSeconds = 60;     /* 1 minute */

      var accountCreation = {}; /* to be returned */
      var i = 0; /* keeps track of number of units tracked, max two */
      var registrationTime = new Date(subredditData.data.genData.created_utc);
      var currentTime = new Date(); /* Date object representing current time */
      accountCreation.date = (registrationTime.getMonth() + '/' + registrationTime.getDate() + '/' + registrationTime.getFullYear().toString().substring(2,4));
      var difference = new Date(Math.round((currentTime.getTime()-subredditData.data.genData.created_utc))); /* Date object representing difference between creation and current time */
      var timeDiff = difference.getTime() / 1000; /* Time difference in seconds */
      var readable = ""; /* Human readable timestamp */

      if (timeDiff >= oneYearInSeconds && i < 2) {
        var numYears = Math.floor(timeDiff / oneYearInSeconds);
        readable += numYears.toString();

        if (numYears >= 2) {
          readable += " years ";
        }
        else {
          readable += " year ";
        }

        timeDiff = timeDiff % oneYearInSeconds; /* number of seconds left after considering years */
        i++;
      }

      if (timeDiff >= oneMonthInSeconds && i < 2) {
        var numMonths = Math.floor(timeDiff / oneMonthInSeconds);
        readable += numMonths.toString();

        if (numMonths >= 2) {
          readable += " months ";
        }
        else {
          readable += " month ";
        }

        timeDiff = timeDiff % oneMonthInSeconds; /* number of seconds left after considering months */
        i++;
      }

      if (timeDiff >= oneWeekInSeconds && i < 2) {
        var numWeeks = Math.floor(timeDiff / oneWeekInSeconds);
        readable += numWeeks.toString();

        if (numWeeks >= 2) {
          readable += " weeks ";
        }
        else {
          readable += " week ";
        }

        timeDiff = timeDiff % oneWeekInSeconds; /* number of seconds left after considering weeks */
        i++;
      }

      if (timeDiff >= oneDayInSeconds && i < 2) {
        var numDays = Math.floor(timeDiff / oneDayInSeconds);
        readable += numDays.toString();

        if (numDays >= 2) {
          readable += " days ";
        }
        else {
          readable += " day ";
        }

        timeDiff = timeDiff % oneDayInSeconds; /* number of seconds left after considering days */
        i++;
      }

      if (timeDiff >= oneHourInSeconds && i < 2) {
        var numHours = Math.floor(timeDiff / oneHourInSeconds);
        readable += numHours.toString();

        if (numHours >= 2) {
          readable += " hours ";
        }
        else {
          readable += " hour ";
        }

        timeDiff = timeDiff % oneHourInSeconds; /* number of seconds left after considering hours */
        i++;
      }

      if (timeDiff >= oneMinuteInSeconds && i < 2) {
        var numMinutes = Math.floor(timeDiff / oneMinuteInSeconds);
        readable += numMinutes.toString();

        if (numMinutes >= 2) {
          readable += " minutes ";
        }
        else {
          readable += " minutes ";
        }

        timeDiff = timeDiff % oneMinuteInSeconds; /* number of seconds left after considering minutes */
        i++;
      }

      accountCreation.age = readable;
      var availableDate = new Date(subredditData.data.genData.created_utc);
      accountCreation.available = availableDate.getMonth() + "/" + availableDate.getDate() + "/" + availableDate.getFullYear().toString().substring(2,4);
      subredditData.accountCreation = accountCreation;
      callback();
    }
  };
});
