var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var UserSchema = new Schema({
	username: {type: String, unique: true},
	topComment: {
		score: Number,
		subreddit: String,
		body: String,
		permalink: String
	},
	topSubmission: {
		score: Number,
		subreddit: String,
		title: String,
		permalink: String
	},
	commentKarma: Number,
	linkKarma: Number,
	creationDate: Number,
	nsfwComments: Number,
	nsfwSubmissions: Number,
	lastUpdated: Number

}, { collection: 'user'});

module.exports = mongoose.model('User', UserSchema);