angular.module('userCtrl', ['userService'])

.controller('userController', function(User) {

	var vm = this;

	vm.comment = "placeholder";

	// set a processing variable
	// vm.processing = true;
	
	vm.all = function() {
		User.getAll(username)
			.success(function(data) {
				vm.block = data;
			});
	};

	vm.topComment = function() {
		User.getTop(username)
			.success(function(data) {
				vm.comment = data;
			});
	};
});