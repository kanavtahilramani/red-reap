'use strict';

angular.module('redreapApp')
  .controller('SubredditCtrl', function (Subreddit, $routeParams) {
    	var vm = this;

      	// var current = new Date(),
       //    	creation;

      	// if ($routeParams.subreddit) {
       //    vm.subreddit = $routeParams.subreddit;
      	// } else {
       //    vm.subreddit = User.getSubredditName();
      	// }

      	// Subreddit.getSubreddit(vm.subreddit, function() {
      	// 	return;
      	// });

  		vm.subreddit = Subreddit.getSubData();
      	vm.processing = false;
  });
