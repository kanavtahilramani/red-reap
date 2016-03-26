var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var SubredditSchema = new Schema({
	subreddit: String,
	test: String
});

module.exports = mongoose.model('Subreddit', SubredditSchema);