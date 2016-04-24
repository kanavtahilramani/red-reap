'use strict';

angular.module('redreapApp')
  .controller('SubredditCtrl', function (Subreddit, $routeParams) {
    	var vm = this;

      	// var current = new Date(),
       //    	creation;

      	if ($routeParams.subreddit) {
          vm.processing = true;
          Subreddit.getSubreddit($routeParams.subreddit, function() {
            Subreddit.getSubreddit2($routeParams.subreddit, function() {
                Subreddit.setAge(function() {
                    vm.subreddit = Subreddit.getSubData();
                    vm.subreddit2 = Subreddit.getSubTwoData();
                    vm.processing = false;
                });
            });
          });
      	}

      	// Subreddit.getSubreddit(vm.subreddit, function() {
      	// 	return;
      	// });

  });