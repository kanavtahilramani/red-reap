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
	score: Number,
	subreddit: String,
	link: String,
	linkType: Number,
	length: Number,
	gilded: Number,
	flaired: Number,
	distinguished: Number,
	hour: Number,
	day: Number,
	month: Number,
	year: Number,
	level: Number
});

var SubMetaSchema = new Schema({
	score: Number,
	subreddit: String,
	link: String,
	linkType: Number,
	length: Number,
	gilded: Number,
	flaired: Number,
	distinguished: Number,
	hour: Number,
	day: Number,
	month: Number,
	year: Number,
	comments: Number,
	title: String,
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
	region: String,
	genCommentData: {
		editingData: {
			totalEditedComments: Number,
			avgEditTime: Number,
			medEditTime: Number
		},
		commentTotals: {
			controversialComments: Number,
			nsfwComments: Number,
			totalReplyComments: Number,
			gildedComments: Number,
			totalGilds: Number,
			totalWords: Number,
			totalFlaired: Number,
			totalDistinguished: Number,
		},
		avgCommentLength: Number,
	},
	genSubmittedData: {
		submittedTotals: {
			controversialSubmitted: Number,
			nsfwSubmitted: Number,
			totalSelfPosts: Number,
			totalLinkPosts: Number,
			gildedSubmitted: Number,
			totalSubmittedGilds: Number,
			totalSubmittedWords: Number,
			totalSubmittedFlaired: Number,
			totalSubmittedDistinguished: Number
		},
		avgSelfPostLength: Number,
		totalCommentsOnSubmitted: Number,
		avgCommentsOnSubmitted: Number
	},
	veryNegativeAdjs: Number,
	negativeAdjs: Number,
	positiveAdjs: Number,
	veryPositiveAdjs: Number,
	vnPer: Number,
	nPer: Number,
	pPer: Number,
	vpPer: Number,
	vnEx: [{adjective: String}],
	nEx: [{adjective: String}],
	pEx: [{adjective: String}],
	vpEx: [{adjective: String}],
	lastUpdated: Number,
	descriptions: [String],
	familyMembers: [String],
	dateData: [MonthSchema],
	dateDataSub: [MonthSchema],
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