'use strict';

angular.module('redreapApp')
  .value('duScrollDuration', 1000)
  .controller('UserCtrl', function (User, $routeParams, $document) {
  		var vm = this;

      var current = new Date(),
          creation;

      // if ($routeParams.username) {
      //     vm.username = $routeParams.username;

          // User.getUser(vm.username, function(userData) {
          //   User.setAge(function() {
          //         User.setExamples(function() {
          //           vm.redditUser = userData;
          //           vm.processing = false;
          //         });
          //       });
          // });
  
      // } else {
          
      // }

      vm.redditUser = User.getUserData();
  });