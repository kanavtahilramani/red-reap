var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var UserSchema = new Schema({
	username: {type: String, unique: true},
	topComment: {
		score: Number,
		body: String
	},
	karma: Number
}, { collection: 'user'});

module.exports = mongoose.model('User', UserSchema);