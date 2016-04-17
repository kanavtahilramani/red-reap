'use strict';

angular.module('redreapApp')
  .directive('linePlot', function (User) {
    return {
      template: '<div></div>',
      restrict: 'EA',
      link: function (scope, element, attrs) {
      	var data = User.getUserData().data;
		var curAction = attrs.action;

      	var margin = {top: 30, right: 20, bottom: 30, left: 40},
		    width = 1000 - margin.left - margin.right,
		    height = 300 - margin.top - margin.bottom;

		var formatDate = d3.time.format("%B/%e/%Y");

		var svg = d3.select(element[0]).append("svg")
		    .attr("width", width + margin.left + margin.right)
		    .attr("height", height + margin.top + margin.bottom + 30)
		  .append("g")
		    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

		if ((curAction == "Timeline"))
		{
			if (curAction == "Timeline")
			{
				var data2 = data.dateDataSub;
				data = data.dateData;

				var x = d3.time.scale()
				    .range([0, width]);

				var y = d3.scale.linear()
				    .range([height, 0]);

				var color = d3.scale.ordinal()
				    .range(["#EA1C1C", "#5D5D5D"]);

				var xAxis = d3.svg.axis()
				    .scale(x)
				    .orient("bottom");

				var yAxis = d3.svg.axis()
				    .scale(y)
				    .orient("left"); 

				var line = d3.svg.line()
				    .x(function(d) { return x(d.fullDate); })
				    .y(function(d) { return y(d.categoryValue); });

				var categoryTypes = d3.keys(data[0]).filter(function(key) { return ((key !== "month") && (key !== "date") && (key !== "year") && (key !== "_id")); });
				var categoryTypes2 = d3.keys(data2[0]).filter(function(key) { return ((key !== "month") && (key !== "date") && (key !== "year") && (key !== "_id")); });

				var categoryNames = ["Karma", "Posts"];

				data.forEach(function(d) {
		      		d.fullDate = formatDate.parse(d.month + '/' + 1 + '/' + d.year);
		      	});

				data2.forEach(function(d) {
		      		d.fullDate = formatDate.parse(d.month + '/' + 1 + '/' + d.year);
		      	});

			  	var categories = categoryTypes.map(function(name) {
			    	return {
			      		name: name,
			      		values: data.map(function(d) {
			        		return {name: name, fullDate: d.fullDate, categoryValue: +d[name]};
			      		})
			    	};
			 	});

			  	var categories2 = categoryTypes2.map(function(name) {
			    	return {
			      		name: name,
			      		values: data2.map(function(d) {
			        		return {name: name, fullDate: d.fullDate, categoryValue: +d[name]};
			      		})
			    	};
			 	});
			  	var categoriesUsed = categories;
			  	var categoryTypesUsed = categoryTypes;
				if (categories[0].values.length >= categories2[0].values.length)
				{
					for (var j = 0; j < categories2[0].values.length; j++)
					{
						categories[0].values[j].categoryValue += categories2[0].values[j].categoryValue;
						categories[1].values[j].categoryValue += categories2[1].values[j].categoryValue;
					}
					categoriesUsed = categories;
					categoryTypesUsed = categoryTypes;
					x.domain(d3.extent(data, function(d) { return d.fullDate; }));
				}
				else
				{
					for (var j = 0; j < categories[0].values.length; j++)
					{
						categories2[0].values[j].categoryValue += categories[0].values[j].categoryValue;
						categories2[1].values[j].categoryValue += categories[1].values[j].categoryValue;
					}
					categoriesUsed = categories2;
					categoryTypesUsed = categoryTypes2;
					x.domain(d3.extent(data2, function(d) { return d.fullDate; }));
				}

				var tip = d3.tip()
				  .attr('class', 'd3-tip')
				  .style("text-align", "center")
				  .offset([-10, 0])
				  .html(function(d) {
				  	for (var i = 0; i < categoryTypesUsed.length; i++) 
				  	{ 
		    			if (d.name == categoryTypesUsed[i])
		    			{
							var month = new Array();
							month[0] = "January";
							month[1] = "February";
							month[2] = "March";
							month[3] = "April";
							month[4] = "May";
							month[5] = "June";
							month[6] = "July";
							month[7] = "August";
							month[8] = "September";
							month[9] = "October";
							month[10] = "November";
							month[11] = "December";

							var tempMonth = month[d.fullDate.getMonth()];
						  	var tempYear = d.fullDate.getFullYear();
		    				return "<div style='padding-bottom:10px;'>" + tempMonth + " "+ tempYear + "</div>" + "<strong>" + categoryNames[i]  + ":</strong><span style='color:red'> " + d.categoryValue + "</span>";
		    			}
					}
				  });

				svg.call(tip);

			    y.domain([
					d3.min(categoriesUsed, function(c) { return d3.min(c.values, function(v) { return v.categoryValue; }); }),
		    		d3.max(categoriesUsed, function(c) { return d3.max(c.values, function(v) { return v.categoryValue; }); })
				]);

				svg.append("g")
				    .attr("class", "x axis")
				    .attr("transform", "translate(0," + height + ")")
				    .call(xAxis);

				svg.append("g")
				    .attr("class", "y axis")
				    .call(yAxis)
				    .append("text")
				      .attr("transform", "rotate(-90)")
				      .attr("dy", ".71em")
				      .style("text-anchor", "end");

				var category = svg.selectAll(".category")
				    .data(categoriesUsed)
				    .enter().append("g")
				      .attr("class", "category");

				category.append("path")
				    .attr("class", "line")
				    .attr("d", function(d) { return line(d.values); })
				    .style("stroke", function(d) { return color(d.name); });

				var point = category.append("g")
				.attr("class", "line-point");

				point.selectAll('circle')
				.data(function(d){ return d.values})
				.enter().append('circle')
				.attr("cx", function(d) { return x(d.fullDate) })
				.attr("cy", function(d) { return y(d.categoryValue) })
				.attr("r", 5)
				.style("fill", "white")
				.style("stroke", function(d) { return color(this.parentNode.__data__.name);})
				.on('mouseover', tip.show)
				.on('mouseout', tip.hide);


			    // reset all the changes made to the data
				data.forEach(function(d) {
					delete d.fullDate;
				});
			}
			
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
		}
      }	
    };
  });