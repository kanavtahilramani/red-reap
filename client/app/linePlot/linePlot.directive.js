'use strict';

angular.module('redreapApp')
  .directive('linePlot', function (User) {
    return {
      template: '<div></div>',
      restrict: 'EA',
      link: function (scope, element, attrs) {
      	var data = User.getUserData().data.data;

      	var margin = {top: 20, right: 20, bottom: 30, left: 50},
		    width = 1060 - margin.left - margin.right,
		    height = 500 - margin.top - margin.bottom;

		var formatDate = d3.time.format("%B/%e/%Y");

		data.forEach(function(d) {
      		d.fullDate = formatDate.parse(d.month + '/' + 1 + 5 + '/' + d.year);
      	});

		var x = d3.time.scale()
		    .range([0, width]);

		var y = d3.scale.linear()
		    .range([height, 0]);

		var xAxis = d3.svg.axis()
		    .scale(x)
		    .orient("bottom").ticks(8);

		var yAxis = d3.svg.axis()
		    .scale(y)
		    .orient("left"); 

		var line = d3.svg.line()
		    .x(function(d) { return x(d.fullDate); })
		    .y(function(d) { return y(d.commentKarmaForMonth); });

		var svg = d3.select("div.linePlot").append("svg")
		    .attr("width", width + margin.left + margin.right)
		    .attr("height", height + margin.top + margin.bottom)
		  .append("g")
		    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	    x.domain(d3.extent(data, function(d) { return d.fullDate; }));
	    y.domain(d3.extent(data, function(d) { return d.commentKarmaForMonth; }));

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

	    svg.append("path")
	      .datum(data)
	      .attr("class", "line")
	      .attr("d", line);
      }	
    };
  });