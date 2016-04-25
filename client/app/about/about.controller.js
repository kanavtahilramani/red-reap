'use strict';
(function(){

function AboutComponent($scope) {
  $scope.message = 'Hello';
}

angular.module('redreapApp')
  .component('about', {
    templateUrl: 'app/about/about.html',
    controller: AboutComponent
  });

})();
