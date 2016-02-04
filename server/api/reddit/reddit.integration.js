'use strict';

var app = require('../..');
import request from 'supertest';

var newReddit;

describe('Reddit API:', function() {

  describe('GET /api/reddit', function() {
    var reddits;

    beforeEach(function(done) {
      request(app)
        .get('/api/reddit')
        .expect(200)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          reddits = res.body;
          done();
        });
    });

    it('should respond with JSON array', function() {
      reddits.should.be.instanceOf(Array);
    });

  });

  describe('POST /api/reddit', function() {
    beforeEach(function(done) {
      request(app)
        .post('/api/reddit')
        .send({
          name: 'New Reddit',
          info: 'This is the brand new reddit!!!'
        })
        .expect(201)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          newReddit = res.body;
          done();
        });
    });

    it('should respond with the newly created reddit', function() {
      newReddit.name.should.equal('New Reddit');
      newReddit.info.should.equal('This is the brand new reddit!!!');
    });

  });

  describe('GET /api/reddit/:id', function() {
    var reddit;

    beforeEach(function(done) {
      request(app)
        .get('/api/reddit/' + newReddit._id)
        .expect(200)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          reddit = res.body;
          done();
        });
    });

    afterEach(function() {
      reddit = {};
    });

    it('should respond with the requested reddit', function() {
      reddit.name.should.equal('New Reddit');
      reddit.info.should.equal('This is the brand new reddit!!!');
    });

  });

  describe('PUT /api/reddit/:id', function() {
    var updatedReddit;

    beforeEach(function(done) {
      request(app)
        .put('/api/reddit/' + newReddit._id)
        .send({
          name: 'Updated Reddit',
          info: 'This is the updated reddit!!!'
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          updatedReddit = res.body;
          done();
        });
    });

    afterEach(function() {
      updatedReddit = {};
    });

    it('should respond with the updated reddit', function() {
      updatedReddit.name.should.equal('Updated Reddit');
      updatedReddit.info.should.equal('This is the updated reddit!!!');
    });

  });

  describe('DELETE /api/reddit/:id', function() {

    it('should respond with 204 on successful removal', function(done) {
      request(app)
        .delete('/api/reddit/' + newReddit._id)
        .expect(204)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          done();
        });
    });

    it('should respond with 404 when reddit does not exist', function(done) {
      request(app)
        .delete('/api/reddit/' + newReddit._id)
        .expect(404)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          done();
        });
    });

  });

});
