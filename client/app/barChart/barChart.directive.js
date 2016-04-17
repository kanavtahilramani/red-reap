'use strict';

angular.module('redreapApp')
  .directive('barChart', function (User) {
    return {
      template: '<div></div>',
      restrict: 'EA',
      link: function (scope, element, attrs) {
        var data = User.getUserData().data;
		var curAction = attrs.action;

        var margin = {top: 30, right: 20, bottom: 30, left: 40},
	    	width = 1000 - margin.left - margin.right,
	    	height = 300 - margin.top - margin.bottom;

	    // var firstComment = new Date(String(data[data.length-1].year) + ", " + String(data[data.length-1].month) + ", " + String(data[data.length-1].date));
	    // var lastComment = new Date(String(data[0].year) + ", " + String(data[0].month) + ", " + String(data[0].date));

		// var x = d3.scale.ordinal()
		// 	.domain(data.map(function(d) {
		// 		return new Date(d.year, d.month, d.date);
		// 	}))
		//     .rangeRoundBands([0, width], .1);

		var x = d3.scale.ordinal()
			.rangeRoundBands([0, width], .1);

		var x1 = d3.scale.ordinal();

		// var x = d3.time.scale()
		// 	.domain([firstComment, lastComment])
		// 	.range([0, width]);

		var y = d3.scale.linear()
		    .range([height, 0]);

		var xAxis = d3.svg.axis()
		    .scale(x)
		    .orient("bottom");
		    //.tickSize(16, 0);
		    // .ticks(6);
		    // .tickFormat(d3.time.format("%B %y"));

		var yAxis = d3.svg.axis()
		    .scale(y)
		    .orient("left")
		    .tickFormat(d3.format(".2s"));

		var svg = d3.select(element[0]).append("svg")
		    .attr("width", width + margin.left + margin.right)
		    .attr("height", height + margin.top + margin.bottom + 30)
		  	.append("g")
		    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

		var color, categoryTypes, categoryTypes2, categoryNames, group;

		if ((curAction == "Year Karma") || (curAction == "Week Karma") || (curAction == "Day Karma") || (curAction == "Popularity"))
		{
			if ((curAction == "Year Karma") || (curAction == "Week Karma") || (curAction == "Day Karma"))
			{
		        if (curAction == "Year Karma")
		        {
		        	var data2 = data.dateDataSub;
					data = data.dateData;

					color = d3.scale.ordinal()
			    		.range(["#EA1C1C", "#5D5D5D"]);

					categoryTypes = d3.keys(data[0]).filter(function(key) { return ((key !== "month") && (key !== "date") && (key !== "year") && (key !== "_id")); });
					categoryTypes2 = d3.keys(data2[0]).filter(function(key) { return ((key !== "month") && (key !== "date") && (key !== "year") && (key !== "_id")); });

					categoryNames = ["Karma", "Posts"];

					x.domain(data.map(function(d) { return d.month; }));

					group = svg.selectAll(".group")
				    .data(data)
				    .enter().append("g")
				      .attr("class", "month")
				      .attr("transform", function(d) { return "translate(" + x(d.month) + ",0)"; });

					data.forEach(function(d) {
						d.categories = categoryTypes.map(function(name) { return {name: name, value: +d[name]}; });
					});

					data2.forEach(function(d) {
						d.categories = categoryTypes2.map(function(name) { return {name: name, value: +d[name]}; });
					});

					for (var j = 0; j < data.length; j++)
					{
						data[j].categories[0].value += data2[j].categories[0].value;
						data[j].categories[1].value += data2[j].categories[1].value;
					}
				}
				else if (curAction == "Week Karma")
				{
					var data2 = data.daySub;
					data = data.day;

					color = d3.scale.ordinal()
			    		.range(["#EA1C1C", "#5D5D5D"]);

					categoryTypes = (d3.keys(data[0]).filter(function(key) { return ((key !== "day") && (key !== "_id")); })).reverse();
					categoryTypes2 = (d3.keys(data2[0]).filter(function(key) { return ((key !== "day") && (key !== "_id")); })).reverse();

					categoryNames = ["Karma", "Posts"];

					data.forEach(function(d) {
					switch(d.day) {
					    case 0:
					        d.day = "Sunday";
					        break;
					    case 1:
							d.day = "Monday";
					        break;
					    case 2:
							d.day = "Tuesday";
					        break;
					    case 3:
							d.day = "Wednesday";
					        break;
					    case 4:
							d.day = "Thursday";
					        break;
					    case 5:
					        d.day = "Friday";
					        break;
					    case 6:
					        d.day = "Saturday";
					        break;
					    default:
					       	d.day = d.day;
					       	break;
					}
					});

					data.forEach(function(d) {
					switch(d.day) {
					    case 0:
					        d.day = "Sunday";
					        break;
					    case 1:
							d.day = "Monday";
					        break;
					    case 2:
							d.day = "Tuesday";
					        break;
					    case 3:
							d.day = "Wednesday";
					        break;
					    case 4:
							d.day = "Thursday";
					        break;
					    case 5:
					        d.day = "Friday";
					        break;
					    case 6:
					        d.day = "Saturday";
					        break;
					    default:
					       	d.day = d.day;
					       	break;
					}
					});

					x.domain(data.map(function(d) { return d.day; }));

					group = svg.selectAll(".group")
				    .data(data)
				    .enter().append("g")
				      .attr("class", "group")
				      .attr("transform", function(d) { return "translate(" + x(d.day) + ",0)"; });

					data.forEach(function(d) {
						d.categories = categoryTypes.map(function(name) { return {name: name, value: +d[name]}; });
					});

					data2.forEach(function(d) {
						d.categories = categoryTypes2.map(function(name) { return {name: name, value: +d[name]}; });
					});

					for (var j = 0; j < data.length; j++)
					{
						data[j].categories[0].value += data2[j].categories[0].value;
						data[j].categories[1].value += data2[j].categories[1].value;
					}
				}
				else if (curAction == "Day Karma")
				{
					var data2 = data.hourSub;
					data = data.hour;

					color = d3.scale.ordinal()
			    		.range(["#EA1C1C", "#5D5D5D"]);

					categoryTypes = (d3.keys(data[0]).filter(function(key) { return ((key !== "hour") && (key !== "_id")); })).reverse();
					categoryTypes2 = (d3.keys(data2[0]).filter(function(key) { return ((key !== "hour") && (key !== "_id")); })).reverse();

					categoryNames = ["Karma", "Posts"];

					x.domain(data.map(function(d) { return d.hour; }));

					group = svg.selectAll(".group")
				    .data(data)
				    .enter().append("g")
				      .attr("class", "month")
				      .attr("transform", function(d) { return "translate(" + x(d.hour) + ",0)"; });

					data.forEach(function(d) {
						d.categories = categoryTypes.map(function(name) { return {name: name, value: +d[name]}; });
					});

					data2.forEach(function(d) {
						d.categories = categoryTypes2.map(function(name) { return {name: name, value: +d[name]}; });
					});

					for (var j = 0; j < data.length; j++)
					{
						data[j].categories[0].value += data2[j].categories[0].value;
						data[j].categories[1].value += data2[j].categories[1].value;
					}
				}
				var tip = d3.tip()
				  .attr('class', 'd3-tip')
				  .offset([-10, 0])
				  .html(function(d) {
				  	for (var i = 0; i < categoryTypes.length; i++) 
				  	{ 
		    			if (d.name == categoryTypes[i])
		    			{
		    				return "<strong>" + categoryNames[i]  + ":</strong><span style='color:red'> " + d.value + "</span>";
		    			}
					}
				  });

				svg.call(tip);

				x1.domain(categoryTypes).rangeRoundBands([0, x.rangeBand()]);
				y.domain([0, d3.max(data, function(d) { return d3.max(d.categories, function(d) { return d.value; }); })]);

				svg.append("g")
				  .attr("class", "x axis")
				  .attr("transform", "translate(0," + height + ")")
				  .call(xAxis);

				svg.append("g")
				  .attr("class", "y axis")
				  .call(yAxis)
				.append("text")
				  .attr("transform", "rotate(-90)")
				  .attr("y", 6)
				  .attr("dy", ".71em")
				  .style("text-anchor", "end");

				group.selectAll("rect")
				      .data(function(d) { return d.categories; })
				    .enter().append("rect")
				      .attr("width", x1.rangeBand())
				      .attr("x", function(d) { return x1(d.name); })
				      .attr("y", function(d) { return y(d.value); })
				      .attr("height", function(d) { return height - y(d.value); })
				      .style("fill", function(d) { return color(d.name); })
				      .on('mouseover', tip.show)
					  .on('mouseout', tip.hide);


				var legend = svg.selectAll(".legend")
			    	.data(categoryNames.slice())
			    	.enter().append("g")
			      		.attr("class", "legend")
			      		.attr("transform", function(d, i) { return "translate(" + (-490 + i * 75) + ", 280)"; });

			  	legend.append("rect")
			      	.attr("x", width - 18)
			      	.attr("width", 18)
			      	.attr("height", 18)
			      	.style("fill", color);

			  	legend.append("text")
			      	.attr("x", width - 24)
			      	.attr("y", 9)
			      	.attr("dy", ".35em")
			      	.style("text-anchor", "end")
			      	.style("font-weight", "bold")
			      	.text(function(d) { return d; });


				// reset all the changes made to the data
				data.forEach(function(d) {
					delete d.categories;
				});
				if (curAction == "Week Karma")
				{
					data.forEach(function(d) {
					switch(d.day) {
					    case "Sunday":
					        d.day = 0;
					        break;
					    case "Monday":
							d.day = 1;
					        break;
					    case "Tuesday":
							d.day = 2;
					        break;
					    case "Wednesday":
							d.day = 3;
					        break;
					    case "Thursday":
							d.day = 4;
					        break;
					    case "Friday":
					        d.day = 5;
					        break;
					    case "Saturday":
					        d.day = 6;
					        break;
					    default:
					       	d.day = d.day;
					       	break;
					}
					});
				}
			}
			else if (curAction == "Popularity")
			{
				var data2 = data.sentimentBySub;
				data = data.comMeta;

				color = "#EA1C1C";

				var subScoreHolder = [];

				for (var i = 0; i < data2.length; i++)
				{
					var totalScore = 0;
					var scoreCount = 0;
					for (var j = 0; j < data.length; j++)
					{
						if (data2[i].sub == data[j].subreddit)
						{
							totalScore += data[j].score;
							scoreCount++;
						} 
					}

					var subScore = {sub: data2[i].sub, avgScore: (totalScore/scoreCount).toFixed(3)};

					subScoreHolder.push(subScore);

				}

				x.domain(subScoreHolder.map(function(d) { return d.sub; }));
				y.domain([Math.min(0, d3.min(subScoreHolder, function(d) { return +d.avgScore; })), d3.max(subScoreHolder, function(d) { return +d.avgScore; })]);


				var tip = d3.tip()
				  .attr('class', 'd3-tip')
				  .offset([-10, 0])
				  .html(function(d) {
		    		return "<strong>Score:</strong><span style='color:red'> " + d.avgScore + "</span>";
				  });

				svg.call(tip);

				svg.append("g")
				    .attr("class", "x axis")
				    .attr("transform", "translate(0," + height + ")")
				    .call(xAxis);

				svg.append("g")
				    .attr("class", "y axis")
				    .call(yAxis)
				    .append("text")
				      .attr("transform", "rotate(-90)");

				svg.selectAll("rect")
				    .data(subScoreHolder)
				    .enter().append("rect")
				      .attr("class", "rect")
				      .attr("x", function(d) { return x(d.sub); })
				      .attr("width", x.rangeBand())
				      .attr("y", function(d) { return y(Math.max(0, d.avgScore)); })
				      .attr("height", function(d) { return Math.abs(y(d.avgScore) - y(0)); })
				      .style("fill", function(d) { return color; })
				      .on('mouseover', tip.show)
					  .on('mouseout', tip.hide);

			}

			// svg.selectAll(".bar")
			//   .data(data)
			// .enter().append("rect")
			//   .attr("class", "bar")
			//   .attr("x", function(d) { return x(d.month); })
			//   .attr("width", x.rangeBand())
			//   .attr("y", function(d) { return y(d.commentKarmaForMonth); })
			//   .attr("height", function(d) { return height - y(d.commentKarmaForMonth); })
			//   .on('mouseover', tip.show)
			//   .on('mouseout', tip.hide)

			// function type(d) {
			//   d.commentKarmaForMonth = +d.commentKarmaForMonth;
			//   return d;
			// }
		}
      }
    };
  });
