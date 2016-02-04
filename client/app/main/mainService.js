angular.module('mainService', [])

.factory('User', function($http) {

	// create a new factory service
	var mainFactory = {};

	// get the top comment
	mainFactory.getTop = function(id) {
		return $http.get('/api/reddit/' + id + '/top');
	};

	// get the whole json block
	mainFactory.getAll = function(id) {
		return $http.get('/api/reddit/' + id);
	};

	// return mainFactory
	return mainFactory;
});