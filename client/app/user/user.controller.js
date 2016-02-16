'use strict';

angular.module('redreapApp')
  .controller('UserCtrl', function (User, $scope, $routeParams) {
  		var vm = this;
      vm.processing = true;
      vm.redditUser = User.getUserData();

      if (!vm.redditUser.data) {
        User.getUser($routeParams.username, function() {
            vm.redditUser = User.getUserData();
            vm.processing = false;
        });
      }
      else {
        vm.processing = false;
      }
  });