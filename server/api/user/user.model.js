var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// var CommentSchema = new Schema({
// 	score: Number,
// 	nsfw: Boolean,
// 	body: String,
// 	edited: Boolean,
// 	subreddit: String,
// 	created: Number,
// 	upvotes: Number
// });

var MonthSchema = new Schema({
	month: String,
	date: Number,
	year: Number,
	commentKarmaForMonth: Number,
	linkKarmaForMonth: Number,
	postsForMonth: Number
});

var DaySchema = new Schema({
	day: Number,
	postsForDay: Number,
	karmaForDay: Number
});

var HourSchema = new Schema({
	hour: Number,
	postsForHour: Number,
	karmaForHour: Number
});

var ComMetaSchema = new Schema({
	subreddit: String,
	link: String,
	linkType: Number,
	length: Number,
	gilded: Number,
	flaired: Number,
	hour: Number,
	day: Number,
	month: Number,
	year: Number,
});

var SubMetaSchema = new Schema({
	subreddit: String,
	link: String,
	linkType: Number,
	length: Number,
	gilded: Number,
	flaired: Number,
	hour: Number,
	day: Number,
	month: Number,
	year: Number,
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
	totalComments: Number,
	totalSubmitted: Number,
	totalEditedComments: Number,
	avgEditTime: Number,
	medEditTime: Number,
	avgCommentLength: Number,
	avgSelfPostLength: Number,
	nsfwComments: Number,
	nsfwSubmitted: Number,
	controversialComments: Number,
	controversialSubmitted: Number,
	gildedComments: Number,
	gildedSubmitted: Number,
	totalGilds: Number,
	totalSubmittedGilds: Number,
	totalWords: Number,
	totalSubmittedWords: Number,
	totalFlaired: Number,
	totalSubmittedFlaired: Number,
	lastUpdated: Number,
	region: String,
	data: [MonthSchema],
	dataSub: [MonthSchema],
	day: [DaySchema],
	daySub: [DaySchema],
	hour: [HourSchema],
	hourSub: [HourSchema],
	comMeta: [ComMetaSchema],
	subMeta: [SubMetaSchema],
	availableFrom: Number,
	negativePercentage: Number,
	negativeExample: [{content: String, trigger: String}]
}, { collection: 'user'});

module.exports = mongoose.model('User', UserSchema);