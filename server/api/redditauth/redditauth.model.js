var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var AuthSchema   = new Schema({
	refresh: String
	// username: { type: String, required: true, index: { unique: true }},
	// password: { type: String, required: true, select: false }
});

module.exports = mongoose.model('RedditAuth', AuthSchema);