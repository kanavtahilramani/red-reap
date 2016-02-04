'use strict';

// import Reddit from './reddit.model';
import creds from '../../config/local.env';
import Token from '../validate/validate.model';
import Snoocore from 'snoocore';

function getRefresh() {
  return Token.findOne();
}

var reddit = new Snoocore({
    userAgent: 'web:red-reap:0.0.1 by (/u/ferristic)',
    oauth: {
        type: 'explicit',
        duration: 'permanent',
        key: creds.client_id,
        secret: creds.redsecret,
        redirectUri: 'http://localhost:9000/api/validate/redirect',
        scope: [ 'identity', 'read', 'history', 'flair' ]
    }
  });

  getRefresh().then(function(data) {
    reddit.setRefreshToken(data.refresh.toString());
  });

export function getUserComments (req, res) {
  // console.log("===========================\n\n" + r + "\n\n==============================");
  reddit('/user/' + req.params.username + '/comments/').get().then(function(result) {
      return res.send(JSON.stringify(result, null, 4));
  });
}

export function getTopComment (req, res) {
  reddit('/user/' + req.params.username + '/comments/').get({
    limit: 1,
    sort: 'top'
  }).then(function(response) {
    return res.send(response.data.children[0].data.body);
  });
}