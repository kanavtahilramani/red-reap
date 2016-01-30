/**
 * Main application file
 */

'use strict';

import express from 'express';
import mongoose from 'mongoose';
mongoose.Promise = require('bluebird');
import config from './config/environment';
import http from 'http';

// Include libs
var creds = require('./config/local.env');
var Snoocore = require('snoocore');

// Connect to MongoDB
mongoose.connect(config.mongo.uri, config.mongo.options);
mongoose.connection.on('error', function(err) {
  console.error('MongoDB connection error: ' + err);
  process.exit(-1);
});

// Populate databases with sample data
if (config.seedDB) { require('./config/seed'); }

// Setup server
var app = express();
var server = http.createServer(app);
require('./config/express')(app);
require('./routes')(app);

// Start server
function startServer() {
  app.angularFullstack = server.listen(config.port, config.ip, function() {
    console.log('Express server listening on %d, in %s mode', config.port, app.get('env'));
  });
}

var reddit = new Snoocore({
  userAgent: 'web:redreap:0.0.1 (by /u/ferristic)',
  oauth: { 
    type: 'explicit', // required when using explicit OAuth
    mobile: false, // defaults to false.
    duration: 'permanent', // defaults to 'temporary'
    key: creds.client_id, 
    // A secret is only needed if your app is type 'web'
    secret: creds.redsecret, 
    redirectUri: 'http://localhost:9000',
    // make sure to set all the scopes you need.
    scope: [ 'flair', 'identity' ] 
  }
});

var state = 'foobar';
console.log(reddit.getAuthUrl(state));

var AUTHORIZATION_CODE = 'WSWlDivAHel0jT80dOHK0y2XqYM';

// Authenticate with reddit by passing in the authorization code from the response
reddit.auth(AUTHORIZATION_CODE).then(function(refreshToken) {
  // The refreshToken will be defined if in the initial
  // config `duration: 'permanent'`
  // Otherwise if using a 'temporary' duration it can be ignored.
  
  // Make an OAuth call to show that it is working
  return reddit('/api/v1/me').get();
})
.then(function(data) {
  console.log(data); // Log the response
}); 

setImmediate(startServer);

// Expose app
exports = module.exports = app;