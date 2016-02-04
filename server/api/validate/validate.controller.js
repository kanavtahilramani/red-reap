// 'use strict';

// import config from '../../config/environment';
// import creds from '../../config/local.env';

// var uniqId = 0; // ID for each user account
// var accounts = {}; // Contains instances of snoocore.
// var Snoocore = require('snoocore');
// var open = require('open');
// var authCode = '';

// // Gets the instance of Snoocore.
// function getInstance(accountId) {
//     // Check if the current account exists. If so, we don't create a new one.
//     if (accounts[accountId]) {
//         return accounts[accountId];
//     }

//     // Return a new Snoocore instance.
//     return new Snoocore({
//     userAgent: 'web:red-reap:0.0.1 by (/u/ferristic)',
//     oauth: {
//         type: 'explicit',
//         duration: 'permanent',
//         key: creds.client_id,
//         secret: creds.redsecret,
//         redirectUri: 'http://localhost:9000/api/validate/redirect',
//         scope: [ 'identity', 'read', 'history', 'flair' ]
//     }
// });
// }

// // Checks for accountID, whether existing in a cookie or not, and starts auth accordingly
// // 'api/validate'
// export function startAuth (req, res) {
//   var accountId = req.cookies ? req.cookies.account_id : void 0;

//   // Account exists, display information.
//   if (accountId && typeof accounts[accountId] === 'function') {
//       return res.redirect('/api/validate/me');
//   }

  

//   // Account does not exist, get authURL and open it.
//   var reddit = getInstance();
//   open(reddit.getAuthUrl());
// }

// // Need to add redirection behavior if a user does not allow the app.
// // 'api/validate/redirect'
// export function storeAcct (req, res) {
//   var accountId = ++uniqId; // Increment uniqID to store a new accountID.
//   var instance = getInstance(); // Get a Snoocore instance to store alongside the ID.

//   // Need to add refresh token behavior.
//   return instance.auth(req.query.code).then(function(refreshToken) {
//       // The Snoocore instance is stored in the hash.
//       accounts[accountId] = instance;
//       // updateRefresh(refreshToken);
//       // account_id is defined as a cookie so we can reference it in further API calls.

//       // console.log("\n\n==========\n\nCONSOLE LOG ACCOUNTS: " + accounts + "\n\n==========\n\n");

      
      
//       console.log("\n\n==========\n\nREFRESH TOKEN: " + refreshToken + "\n\n==========\n\n");
//       res.cookie('account_id', String(accountId), { maxAge: 900000, httpOnly: true });
//       // We are now authenticated, display current user information
//       return res.redirect('/api/validate/me');
//   });
// }

// // Display information about current user
// // 'api/validate/me'
// export function myUser (req, res) {
//   var accountId = req.cookies ? req.cookies.account_id : void 0;

//   // The user should not be here unless they are authenticated, this checks for that
//   if (!accountId || typeof accounts[accountId] === 'undefined') {
//       return res.redirect('/api/validate');
//   }

//   // Display current user information
//   return accounts[accountId]('/api/v1/me').get().then(function(result) {
//       return res.send(JSON.stringify(result, null, 4));
//   });
// }

// // module.exports = { 'reddit': accounts[0] };