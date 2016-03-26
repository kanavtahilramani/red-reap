'use strict';

describe('Service: subFactory', function () {

  // load the service's module
  beforeEach(module('redreapApp'));

  // instantiate service
  var subFactory;
  beforeEach(inject(function (_subFactory_) {
    subFactory = _subFactory_;
  }));

  it('should do something', function () {
    expect(!!subFactory).toBe(true);
  });

});
