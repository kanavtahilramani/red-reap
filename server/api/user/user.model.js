var mongoose = require('mongoose');
var Schema = mongoose.Schema;
// var CommentSchema = require('./comment.model');

var CommentSchema = new Schema({
	score: Number,
	nsfw: Boolean,
	body: String,
	edited: Boolean,
	subreddit: String,
	created: Number,
	upvotes: Number
});

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
	lastUpdated: Number,
	comments: [CommentSchema]
}, { collection: 'user'});

module.exports = mongoose.model('User', UserSchema);