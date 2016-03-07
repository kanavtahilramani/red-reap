'use strict';

angular.module('redreapApp')
  .controller('UserCtrl', function (User, $routeParams) {
  		var vm = this;
      vm.processing = true;

      var current = new Date(),
          creation;

      if ($routeParams.username) {
          vm.username = $routeParams.username;
      } else {
          vm.username = User.getUsername();
      }

      User.getUser(vm.username, function(userData) {
        vm.redditUser = userData;
        User.getAge(function(accountAge) {
              vm.accountCreation = accountAge;
              User.getExamples(function(exampleComments) {
                vm.example1 = exampleComments[1];
                vm.example2 = exampleComments[2];
                vm.example3 = exampleComments[3];

                vm.processing = false;
              });
            });
      });
  });