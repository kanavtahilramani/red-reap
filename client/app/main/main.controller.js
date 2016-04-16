'use strict';

angular.module('redreapApp')
  .controller('MainController', function(User, Subreddit, $location) {
  		var vm = this;
		vm.search = function(username) {
				vm.loading = true;
				User.getUser(username, function() {
					User.setAge(function() {
                  		User.setExamples(function() {
                    		$location.path('/user/' + username);
							vm.loading = false;
                  		});
                	});
				});

				// setInterval(function(){ 
    // 				var currentProgress = User.fetchProgress();
    // 				// console.log(currentProgress + '\n');
				// }, 1000);
		};

		vm.searchSub = function(subreddit) {
			vm.processing = true;
			Subreddit.getSubreddit(subreddit, function() {
				$location.path('/r/' + subreddit);
				vm.processing = false;
			});
		};
  });