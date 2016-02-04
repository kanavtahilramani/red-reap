'use strict';

var proxyquire = require('proxyquire').noPreserveCache();

var redditCtrlStub = {
  index: 'redditCtrl.index',
  show: 'redditCtrl.show',
  create: 'redditCtrl.create',
  update: 'redditCtrl.update',
  destroy: 'redditCtrl.destroy'
};

var routerStub = {
  get: sinon.spy(),
  put: sinon.spy(),
  patch: sinon.spy(),
  post: sinon.spy(),
  delete: sinon.spy()
};

// require the index with our stubbed out modules
var redditIndex = proxyquire('./index.js', {
  'express': {
    Router: function() {
      return routerStub;
    }
  },
  './reddit.controller': redditCtrlStub
});

describe('Reddit API Router:', function() {

  it('should return an express router instance', function() {
    redditIndex.should.equal(routerStub);
  });

  describe('GET /api/reddit', function() {

    it('should route to reddit.controller.index', function() {
      routerStub.get
        .withArgs('/', 'redditCtrl.index')
        .should.have.been.calledOnce;
    });

  });

  describe('GET /api/reddit/:id', function() {

    it('should route to reddit.controller.show', function() {
      routerStub.get
        .withArgs('/:id', 'redditCtrl.show')
        .should.have.been.calledOnce;
    });

  });

  describe('POST /api/reddit', function() {

    it('should route to reddit.controller.create', function() {
      routerStub.post
        .withArgs('/', 'redditCtrl.create')
        .should.have.been.calledOnce;
    });

  });

  describe('PUT /api/reddit/:id', function() {

    it('should route to reddit.controller.update', function() {
      routerStub.put
        .withArgs('/:id', 'redditCtrl.update')
        .should.have.been.calledOnce;
    });

  });

  describe('PATCH /api/reddit/:id', function() {

    it('should route to reddit.controller.update', function() {
      routerStub.patch
        .withArgs('/:id', 'redditCtrl.update')
        .should.have.been.calledOnce;
    });

  });

  describe('DELETE /api/reddit/:id', function() {

    it('should route to reddit.controller.destroy', function() {
      routerStub.delete
        .withArgs('/:id', 'redditCtrl.destroy')
        .should.have.been.calledOnce;
    });

  });

});
