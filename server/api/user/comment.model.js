var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var CommentSchema = new Schema({
	comments: {
			score: Number,
			nsfw: Boolean,
			body: String,
			edited: Boolean,
			subreddit: String,
			created: Number,
			upvotes: Number,
			}
}, { collection: 'user'});

module.exports = ('Comment', CommentSchema);