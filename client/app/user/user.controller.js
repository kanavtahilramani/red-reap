'use strict';

angular.module('redreapApp')
  .controller('UserCtrl', function (User, $routeParams) {
  		var vm = this;
      vm.processing = true;
      vm.redditUser = User.getUserData();
      vm.testing = "hello";
      var current = new Date();
      var creation;

      /* direct route */
      if (!vm.redditUser.data) {
        User.getUser($routeParams.username, function() {
            vm.redditUser = User.getUserData();
            User.getAge(function(accountAge) {
              vm.accountCreation = accountAge;
              User.getExamples(function(exampleComments) {
                vm.example1 = exampleComments[1];
                vm.example2 = exampleComments[2];
                vm.example3 = exampleComments[3];
                vm.redditUser.data.negativePercentage = vm.redditUser.data.negativePercentage.toPrecision(3);
                vm.redditUser.data.avgCommentLength = Math.floor(vm.redditUser.data.avgCommentLength);
                if (vm.redditUser.data.avgEditTime < 3600)
                {
                  vm.redditUser.data.avgEditTime = "<1 hour";
                }
                else
                {
                  var curAvgEditTime = Math.floor((vm.redditUser.data.avgEditTime)/3600);
                  if (curAvgEditTime == 1)
                  {
                    vm.redditUser.data.avgEditTime = (curAvgEditTime).toString() + " hour";
                  }
                  else
                  {
                    vm.redditUser.data.avgEditTime = (curAvgEditTime).toString() + " hours";
                  }
                }

                if (vm.redditUser.data.totalComments >= 1000)
                {
                  vm.redditUser.data.totalComments = ">" + (vm.redditUser.data.totalComments).toString();
                }
                vm.processing = false;
              });
            });
        });
      }

      /* through main */
      else {
        User.getAge(function(accountAge) {
            vm.accountCreation = accountAge;
            User.getExamples(function(exampleComments) {
                vm.example1 = exampleComments[1];
                vm.example2 = exampleComments[2];
                vm.example3 = exampleComments[3];
                vm.processing = false;
            });
        });
      }
  });