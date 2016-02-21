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

var MonthSchema = new Schema({
	month: String,
	year: Number,
	commentKarmaForMonth: Number,
	linkKarmaForMonth: Number,
	postsForMonth: Number
});

var HourSchema = new Schema({
	hour: Number,
	postsForHour: Number,
	commentKarmaForHour: Number
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
	karma: {
		totalCommentScore: Number,
		totalLinkScore: Number,
		commentScore: Number,
		linkScore: Number
	},
	creationTime: Number,
	nsfwComments: Number,
	nsfwSubmissions: Number,
	lastUpdated: Number,
	comments: [CommentSchema],
	data: [MonthSchema],
	hour: [HourSchema]
}, { collection: 'user'});

module.exports = mongoose.model('User', UserSchema);