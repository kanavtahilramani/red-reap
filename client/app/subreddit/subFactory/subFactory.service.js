'use strict';

angular.module('redreapApp')
  .factory('Subreddit', function ($http) {
    var subredditData = {};

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
      getSubData: function () {
        return subredditData;
      },
      getSubredditName: function () {
        return subredditData.data.subreddit;
      }
    };
  });
