var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var TokenSchema   = new Schema({
	refresh: String
}, { collection: 'token'});

module.exports = mongoose.model('Token', TokenSchema);