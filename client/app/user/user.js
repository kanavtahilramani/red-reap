'use strict';

angular.module('redreapApp')
  .config(function ($routeProvider) {
    $routeProvider
      // .when('/user', { // add checking
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