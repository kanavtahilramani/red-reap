'use strict';

angular.module('redreapApp')
  .controller('MainController', function(User, $location) {
  		var vm = this;

		vm.search = function(username) {
			// add processing
				User.getUser(username, function() {
					$location.path('/user/' + username);
				});
					
					// vm.commentKarma = data.commentKarma;
					// vm.linkKarma = data.linkKarma;
					// vm.username = username;
					// vm.topSubmission = data.topSubmission;
					// vm.topComment = data.topComment;
					// var current = new Date();
					// var creation = new Date(data.creationDate);
					// vm.accountAge = Math.round((current-creation));
					// console.log(vm.accountAge);
				// });
		};
  });