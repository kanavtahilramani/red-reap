'use strict';

angular.module('redreapApp')
  .config(function ($routeProvider) {
    $routeProvider
      // .when('/user', {
      //   templateUrl: 'app/user/user.html',
      //   controller: 'UserCtrl',
      //   controllerAs: 'user'
      // })
      .when('/user/:username', {
      	templateUrl: 'app/user/user.html',
      	controller: 'UserCtrl',
      	controllerAs: 'user'
      });
  });