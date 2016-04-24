'use strict';

angular.module('redreapApp')
  .config(function ($routeProvider) {
    $routeProvider
      .when('/subreddit', {
      	templateUrl: 'app/subreddit/subreddit.html',
        controller: 'MainController',
        controllerAs: 'main'
      })
      .when('/r/:subreddit', {
        templateUrl: 'app/subreddit/sub.html',
        controller: 'SubredditCtrl',
        controllerAs: 'sub'
      });
  });