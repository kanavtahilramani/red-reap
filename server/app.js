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
// var readline = require('readline');
// var url = require('url');
// var open = require('open');
// var when = require('when');
// var callbacks = require('when/callbacks');
// var cookieParser = require('cookie-parser');
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

// app.use(cookieParser());

// Start server
function startServer() {
  app.angularFullstack = server.listen(config.port, config.ip, function() {
    console.log('Express server listening on %d, in %s mode', config.port, app.get('env'));
  });
}

// var uniqId = 0;
// var accounts = {};

// function getInstance(accountId) {
//     // Check if we already have an instance with this id. If
//     // so, use this instance
//     if (accounts[accountId]) {
//         return accounts[accountId];
//     }

//     // Else, return a new instance
//     return new Snoocore({
//   		userAgent: 'web:redreap:0.0.1 (by /u/ferristic)',
//   		oauth: {
// 		    type: 'explicit',
// 		    duration: 'permanent',
// 		    key: creds.client_id,
// 		    secret: creds.redsecret,
// 		    redirectUri: 'http://localhost:9000/redirect',
// 		    scope: [ 'identity' ]
//   		}
// 	});
// }

// app.get('/', function (req, res) {
//     var accountId = req.cookies ? req.cookies.account_id : void 0;

//     // The account exists, no need to authenticate
//     if (accountId && typeof accounts[accountId] === 'function') {
//         return res.redirect('/me');
//     }

//     var reddit = getInstance();
//     return res.send('<a href="' + reddit.getAuthUrl() + '">Authenticate!</a>');
// });

// app.get('/me', function(req, res) {

//     var accountId = req.cookies ? req.cookies.account_id : void 0;

//     // If the user has not authenticated bump them back to the main route
//     if (!accountId || typeof accounts[accountId] === 'undefined') {
//         return res.redirect('/');
//     }

//     // Print out stats about the user, that's it.
//     return accounts[accountId]('/api/v1/me').get().then(function(result) {
//         return res.send(JSON.stringify(result, null, 4));
//     });
// });

// // does not account for hitting "deny" / etc. Assumes that
// // the user has pressed "allow"
// app.get('/redirect', function(req, res) {
//     var accountId = ++uniqId; // an account id for this instance
//     var instance = getInstance(); // an account instance

//     // In a real app, you would save the refresh token in
//     // a database / etc for use later so the user does not have
//     // to allow your app every time...
//     return instance.auth(req.query.code).then(function(refreshToken) {
//         // Store the account (Snoocore instance) into the accounts hash
//         accounts[accountId] = instance;

//         // Set the account_id cookie in the users browser so that
//         // later calls we can refer to the stored instance in the
//         // account hash

//         console.log(accounts);
//         res.cookie('account_id', String(accountId), { maxAge: 900000, httpOnly: true });

//         // redirect to the authenticated route
//         return res.redirect('/me');
//     });
// });

/* Call to reddit

var reddit = new Snoocore({
  userAgent: 'web:redreap:0.0.1 (by /u/ferristic)',
  oauth: {
    type: 'explicit',
    duration: 'permanent',
    key: creds.client_id,
    secret: creds.redsecret,
    redirectUri: 'http://localhost:9000/redirect',
    scope: [ 'identity' ]
  }
});

var AUTHORIZATION_CODE = '';

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

*/

setImmediate(startServer);

// Expose app
exports = module.exports = app;