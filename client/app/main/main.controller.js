'use strict';

angular.module('redreapApp')
  .controller('MainController', function(User, $location) {
  		var vm = this;
  		// vm.loading = false;
		vm.search = function(username) {
			// add processing
				vm.loading = true;
				User.getUser(username, function() {
					vm.loading = false;
					$location.path('/user/' + username);
				});
		};
  });