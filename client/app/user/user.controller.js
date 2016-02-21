'use strict';

angular.module('redreapApp')
  .controller('UserCtrl', function (User, $routeParams) {
  		var vm = this;
      vm.processing = true;
      vm.redditUser = User.getUserData();

      var current = new Date();
      var creation;

      /* direct route */
      if (!vm.redditUser.data) {
        User.getUser($routeParams.username, function() {
            vm.redditUser = User.getUserData();
            User.getAge(function(accountAge) {
              vm.accountCreation = accountAge;
              // console.log(vm.redditUser.data.data);
              vm.processing = false;
            });
        });
      }

      /* through main */
      else {
        User.getAge(function(accountAge) {
            vm.accountCreation = accountAge;
            vm.processing = false;
        });
      }
  });