angular.module('mainService', [])

.factory('User', function($http) {
	var userData = {};
	return {
		getUserData: function() {
			// console.log(userData);
			return userData;
		},
		getUser: function(user, callback) {
			$http.get('/api/reddit/' + user).then(function(data) {
                data.data.genCommentData.avgCommentLength = Math.floor(data.data.genCommentData.avgCommentLength);

                if (data.data.genCommentData.editingData.avgEditTime < 3600) {
					if (data.data.genCommentData.editingData.avgEditTime < 60)
					{
						data.data.genCommentData.editingData.medEditTime = (data.data.genCommentData.editingData.avgEditTime).toString() + " seconds";
					}
					else
					{
					    var curAvgEditTime = Math.floor((data.data.genCommentData.editingData.avgEditTime)/60);
						if (curAvgEditTime == 1) {
						    data.data.genCommentData.editingData.avgEditTime = (curAvgEditTime).toString() + " minute";
						}
						else {
						data.data.genCommentData.editingData.avgEditTime = (curAvgEditTime).toString() + " minutes";
						}
					}                
                 } 
                 else {
                    var curAvgEditTime = Math.floor((data.data.genCommentData.editingData.avgEditTime)/3600);

                    if (curAvgEditTime == 1) {
                      data.data.genCommentData.editingData.avgEditTime = (curAvgEditTime).toString() + " hour";
                    }
                    else {
                      data.data.genCommentData.editingData.avgEditTime = (curAvgEditTime).toString() + " hours";
                    }
                }

				if (data.data.genCommentData.editingData.medEditTime < 3600) {
					if (data.data.genCommentData.editingData.medEditTime < 60)
					{
						data.data.genCommentData.editingData.medEditTime = (data.data.genCommentData.editingData.medEditTime).toString() + " seconds";
                  	}
                  	else
                  	{
                  		var curMedEditTime = Math.floor((data.data.genCommentData.editingData.medEditTime)/60);
	                    if (curMedEditTime == 1) {
	                      data.data.genCommentData.editingData.medEditTime = (curMedEditTime).toString() + " minute";
	                    }
	                    else {
	                      data.data.genCommentData.editingData.medEditTime = (curMedEditTime).toString() + " minutes";
	                    }
                  	}
                } else {
                    var curMedEditTime = Math.floor((data.data.genCommentData.editingData.medEditTime)/3600);

                    if (curMedEditTime == 1) {
                      data.data.genCommentData.editingData.medEditTime = (curMedEditTime).toString() + " hour";
                    }
                    else {
                      data.data.genCommentData.editingData.medEditTime = (curMedEditTime).toString() + " hours";
                    }
                }

                if (data.data.totalComments >= 1000) {
                  data.data.totalComments = ">" + (data.data.totalComments).toString();
                }

				userData = data;
				callback();
			});
		},
		getUsername: function() {
			return userData.data.username;
		},
		setExamples: function(callback) {
			var first, second, key;
			var single = [];
			var arr = [[]];

			userData.data.negativeExample.forEach(function(d) {
				single.push(d.content.substring(0, d.content.search(d.trigger)));
				single.push(d.trigger);
				single.push(d.content.substring(d.content.search(d.trigger) + d.trigger.length + 1, d.content.length));
				arr.push(single);
				single = [];
			});
			userData.example1 = arr[1];
            userData.example2 = arr[2];
            userData.example3 = arr[3];
			callback();
		},
		getMetadata: function() {

		},
		setAge: function(callback) {
			const oneYearInSeconds = 31556736; /* 1 year (365.24 days) */ 
			const oneMonthInSeconds = 2627942; /* 1 month (30.416 days) */
			const oneWeekInSeconds = 604800;   /* 1 week (7 days) */
			const oneDayInSeconds = 86400;     /* 1 day */
			const oneHourInSeconds = 3600; 	   /* 1 hour */
			const oneMinuteInSeconds = 60;     /* 1 minute */

			var accountCreation = {}; /* to be returned */
			var i = 0; /* keeps track of number of units tracked, max two */
			var registrationTime = new Date(userData.data.creationTime);
			var currentTime = new Date(); /* Date object representing current time */
			accountCreation.date = (registrationTime.getMonth() + '/' + registrationTime.getDate() + '/' + registrationTime.getFullYear().toString().substring(2,4));
			var difference = new Date(Math.round((currentTime.getTime()-userData.data.creationTime))); /* Date object representing difference between creation and current time */
			var timeDiff = difference.getTime() / 1000; /* Time difference in seconds */
			var readable = ""; /* Human readable timestamp */

			if (timeDiff >= oneYearInSeconds && i < 2) {
				var numYears = Math.floor(timeDiff / oneYearInSeconds);
				readable += numYears.toString();

				if (numYears >= 2) {
					readable += " years ";
				}
				else {
					readable += " year ";
				}

				timeDiff = timeDiff % oneYearInSeconds; /* number of seconds left after considering years */
				i++;
			}

			if (timeDiff >= oneMonthInSeconds && i < 2) {
				var numMonths = Math.floor(timeDiff / oneMonthInSeconds);
				readable += numMonths.toString();

				if (numMonths >= 2) {
					readable += " months ";
				}
				else {
					readable += " month ";
				}

				timeDiff = timeDiff % oneMonthInSeconds; /* number of seconds left after considering months */
				i++;
			}

			if (timeDiff >= oneWeekInSeconds && i < 2) {
				var numWeeks = Math.floor(timeDiff / oneWeekInSeconds);
				readable += numWeeks.toString();

				if (numWeeks >= 2) {
					readable += " weeks ";
				}
				else {
					readable += " week ";
				}

				timeDiff = timeDiff % oneWeekInSeconds; /* number of seconds left after considering weeks */
				i++;
			}

			if (timeDiff >= oneDayInSeconds && i < 2) {
				var numDays = Math.floor(timeDiff / oneDayInSeconds);
				readable += numDays.toString();

				if (numDays >= 2) {
					readable += " days ";
				}
				else {
					readable += " day ";
				}

				timeDiff = timeDiff % oneDayInSeconds; /* number of seconds left after considering days */
				i++;
			}

			if (timeDiff >= oneHourInSeconds && i < 2) {
				var numHours = Math.floor(timeDiff / oneHourInSeconds);
				readable += numHours.toString();

				if (numHours >= 2) {
					readable += " hours ";
				}
				else {
					readable += " hour ";
				}

				timeDiff = timeDiff % oneHourInSeconds; /* number of seconds left after considering hours */
				i++;
			}

			if (timeDiff >= oneMinuteInSeconds && i < 2) {
				var numMinutes = Math.floor(timeDiff / oneMinuteInSeconds);
				readable += numMinutes.toString();

				if (numMinutes >= 2) {
					readable += " minutes ";
				}
				else {
					readable += " minutes ";
				}

				timeDiff = timeDiff % oneMinuteInSeconds; /* number of seconds left after considering minutes */
				i++;
			}

			accountCreation.age = readable;
			var availableDate = new Date(userData.data.availableFrom);
			accountCreation.available = availableDate.getMonth() + "/" + availableDate.getDate() + "/" + availableDate.getFullYear().toString().substring(2,4);
			userData.accountCreation = accountCreation;
			callback();
		}
	}
});