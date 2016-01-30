'use strict';

angular.module('redreapApp.auth', [
  'redreapApp.constants',
  'redreapApp.util',
  'ngCookies',
  'ngRoute'
])
  .config(function($httpProvider) {
    $httpProvider.interceptors.push('authInterceptor');
  });
