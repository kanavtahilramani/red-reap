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
		permalink: String,
		avgComments: Number
	},
	topComments: {
		indices: [Number],
		content: [String],
		avgScore: Number,
		avgLength: Number,
		avgLinkType: Number,
		avgLevel: Number,
		avgSentiment: Number
	},
	topSubmissions: {
		indices: [Number],
		content: [String],
		avgScore: Number,
		avgLength: Number,
		avgLinkType: Number,
		avgComments: Number,
		avgSentiment: Number
	},
	bottomComments: {
		indices: [Number],
		content: [String],
		avgScore: Number,
		avgLength: Number,
		avgLinkType: Number,
		avgLevel: Number,
		avgSentiment: Number
	},
	bottomSubmissions: {
		indices: [Number],
		content: [String],
		avgScore: Number,
		avgLength: Number,
		avgLinkType: Number,
		avgComments: Number,
		avgSentiment: Number
	},
	karma: {
		totalCommentScore: Number,
		totalLinkScore: Number,
		commentScore: Number,
		linkScore: Number
	},
	is_gold: String,
	is_mod: String,
	has_verified_email: String,
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
			totalRegComments: Number,
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
	gender: String,
	myLocation: [String],
	negativePercentage: Number,
	negativeExample: [{content: String, trigger: String}],
	sentimentBySub: [{sub: String, subid: String, negativeCount: Number, neutralCount: Number, positiveCount: Number, total: Number, negPer: Number, neuPer: Number, posPer: Number, avSentSent: Number}],
	languageBySub: [{sub: String, subid: String, simple: Number, compound: Number, complex: Number, compoundComplex: Number, totalWords: Number, totalCharacters: Number, avWordLength: Number, weightedSentenceStructureScore: Number, languageComplexityScore: Number}],

}, { collection: 'user'});

module.exports = mongoose.model('User', UserSchema);