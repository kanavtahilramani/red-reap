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
                console.log("last callback");
                vm.example1 = exampleComments[1];
                vm.example2 = exampleComments[2];
                vm.example3 = exampleComments[3];
                // vm.redditUser.data.negativePercentage = vm.redditUser.data.negativePercentage.toPrecision(3);
                // vm.redditUser.data.avgCommentLength = Math.floor(vm.redditUser.data.avgCommentLength);

                if (vm.redditUser.data.avgEditTime < 3600) {
                  vm.redditUser.data.avgEditTime = "<1 hour";
                } else {
                    var curAvgEditTime = Math.floor((vm.redditUser.data.avgEditTime)/3600);

                    if (curAvgEditTime == 1) {
                      vm.redditUser.data.avgEditTime = (curAvgEditTime).toString() + " hour";
                    }
                    else {
                      vm.redditUser.data.avgEditTime = (curAvgEditTime).toString() + " hours";
                    }
                }

                if (vm.redditUser.data.totalComments >= 1000) {
                  vm.redditUser.data.totalComments = ">" + (vm.redditUser.data.totalComments).toString();
                }

                vm.processing = false;
              });
            });
      });
  });