'use strict';

describe('Controller: SubredditCtrl', function () {

  // load the controller's module
  beforeEach(module('redreapApp'));

  var SubredditCtrl, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    SubredditCtrl = $controller('SubredditCtrl', {
      $scope: scope
    });
  }));

  it('should ...', function () {
    expect(1).toEqual(1);
  });
});
