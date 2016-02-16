angular.module('mainService', [])

.factory('User', function($http) {
	var userData = {};
	return {
		getUserData: function() {
			return userData;
		},
		getUser: function(user, callback) {
			$http.get('/api/reddit/' + user).then(function(data) {
				userData = data;
				callback();
			});
		}
	}
});