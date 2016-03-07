'use strict';

angular.module('redreapApp')
  .directive('barChart', function (User) {
    return {
      template: '<div></div>',
      restrict: 'EA',
      link: function (scope, element, attrs) {
        var data = User.getUserData().data.dateData;
        var margin = {top: 40, right: 20, bottom: 30, left: 40},
	    	width = 925 - margin.left - margin.right,
	    	height = 400 - margin.top - margin.bottom;

	    var firstComment = new Date(String(data[data.length-1].year) + ", " + String(data[data.length-1].month) + ", " + String(data[data.length-1].date));
	    var lastComment = new Date(String(data[0].year) + ", " + String(data[0].month) + ", " + String(data[0].date));

		var x = d3.scale.ordinal()
			.domain(data.map(function(d) {
				return new Date(d.year, d.month, d.date);
			}))
		    .rangeRoundBands([0, width], .1);

		// var x = d3.time.scale()
		// 	.domain([firstComment, lastComment])
		// 	.range([0, width]);

		var y = d3.scale.linear()
		    .range([height, 0]);

		var xAxis = d3.svg.axis()
		    .scale(x)
		    .orient("bottom")
		    .tickSize(16, 0);
		    // .ticks(6);
		    // .tickFormat(d3.time.format("%B %y"));

		var yAxis = d3.svg.axis()
		    .scale(y)
		    .orient("left");

		var tip = d3.tip()
		  .attr('class', 'd3-tip')
		  .offset([-10, 0])
		  .html(function(d) {
		    return "<strong>karma:</strong> <span style='color:red'>" + d.commentKarmaForMonth + "</span>";
		  });

		var svg = d3.select(element[0]).append("svg")
		    .attr("width", width + margin.left + margin.right)
		    .attr("height", height + margin.top + margin.bottom)
		  	.append("g")
		    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

		svg.call(tip);

		x.domain(data.map(function(d) { return d.month; }));
		y.domain([0, d3.max(data, function(d) { return d.commentKarmaForMonth; })]);

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
		  .style("text-anchor", "end")
		  .text("comment karma");

		svg.selectAll(".bar")
		  .data(data)
		.enter().append("rect")
		  .attr("class", "bar")
		  .attr("x", function(d) { return x(d.month); })
		  .attr("width", x.rangeBand())
		  .attr("y", function(d) { return y(d.commentKarmaForMonth); })
		  .attr("height", function(d) { return height - y(d.commentKarmaForMonth); })
		  .on('mouseover', tip.show)
		  .on('mouseout', tip.hide)

		function type(d) {
		  d.commentKarmaForMonth = +d.commentKarmaForMonth;
		  return d;
		}
      }
    };
  });
