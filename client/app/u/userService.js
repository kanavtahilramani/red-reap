angular.module('userService', [])

.factory('User', function($http) {

	// create a new factory service
	var userFactory = {};

	// get the top comment
	userFactory.getTop = function(id) {
		return $http.get('/api/reddit/' + id + '/top');
	};

	// get the whole json block
	userFactory.getAll = function(id) {
		return $http.get('/api/reddit/' + id);
	};

	// return userFactory
	return userFactory;
});