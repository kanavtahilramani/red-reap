'use strict';

angular.module('redreapApp')
  .value('duScrollDuration', 1000)
  .controller('UserCtrl', function (User, $routeParams, $document) {
  		var vm = this;

      var current = new Date(),
          creation;

      if ($routeParams.username) {
          vm.processing = true;
          vm.username = $routeParams.username;

          User.getUser(vm.username, function() {
            vm.redditUser = User.getUserData();
            User.setAge(function() {
                  User.setExamples(function() {
                    vm.processing = false;
                  });
                });
          });
  
      }
  });