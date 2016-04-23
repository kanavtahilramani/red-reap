var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var SubredditSchema = new Schema({
	subreddit: String,
	test: String,
	genData: {
		wiki_enabled: String,
		display_name: String,
		public_description: String,
		header_title: String,
		subscribers: Number,
		created_utc: Number,
		subreddit_type: String,
		submission_type: String,
		header_img: String,
		banner_img: String,
		lang: String,
		over18: String
	},
	comments: [String]
});

module.exports = mongoose.model('Subreddit', SubredditSchema);