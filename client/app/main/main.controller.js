'use strict';

angular.module('redreapApp')
  .controller('MainController', function(User, $location) {
  		var vm = this;

		vm.search = function(username) {
			// add processing
				User.getUser(username, function() {
					$location.path('/user/' + username);
				});
		};
  });