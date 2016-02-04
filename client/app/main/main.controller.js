'use strict';

angular.module('redreapApp')
  .controller('MainController', function(User) {
  		var vm = this;
		
		vm.all = function(username) {
			User.getAll(username)
				.success(function(data) {
					vm.block = data;
				});
		};

		vm.topComment = function(username) {
			User.getTop(username)
				.success(function(data) {
					vm.comment = data;
				});
		};
  });