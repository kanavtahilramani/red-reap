'use strict';

angular.module('userCtrl')
  .config(function($routeProvider, $locationProvider) {
    $routeProvider

      .when('/user', {
      	templateUrl: 'app/u/user.html',
      	controller: 'userController',
      	controllerAs: 'user'
      })

      .when('/u/:username', {
        templateUrl: 'app/u/user.html',
        controller: 'userController',
        controllerAs: 'user'
      })

      .when('/u/:username/top', {
        templateUrl: 'app/u/top.html',
        controller: 'userController',
        controllerAs: 'user'
      });

   $locationProvider.html5Mode(true);
});