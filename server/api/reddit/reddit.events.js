/**
 * Reddit model events
 */

'use strict';

import {EventEmitter} from 'events';
var Reddit = require('./reddit.model');
var RedditEvents = new EventEmitter();

// Set max event listeners (0 == unlimited)
RedditEvents.setMaxListeners(0);

// Model events
var events = {
  'save': 'save',
  'remove': 'remove'
};

// Register the event emitter to the model events
for (var e in events) {
  var event = events[e];
  Reddit.schema.post(e, emitEvent(event));
}

function emitEvent(event) {
  return function(doc) {
    RedditEvents.emit(event + ':' + doc._id, doc);
    RedditEvents.emit(event, doc);
  }
}

export default RedditEvents;
