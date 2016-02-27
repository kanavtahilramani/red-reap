'use strict';

angular.module('redreapApp')
  .directive('donut', function () {
    return {
      template: '<div></div>',
      restrict: 'EA',
      link: function (scope, element, attrs) {
        var dataset = [
          { label: 'Positive', count: 67, enabled: true }, 
          { label: 'Negative', count: 33, enabled: true },
        ];

        var svgWidth  = 360,
            svgHeight = 360,
            radius = Math.min(svgWidth, svgHeight) / 2,
            donutWidth = 75;

        //var color = d3.scale.category20();    
     
        var color = d3.scale.ordinal()
        .range(['#D22E2E', '#FF6E6E', '#B3F2C9', '#528C18', '#C3F25C']); 

        var svg = d3.select('#chart')
                    .append('svg')
                      .attr('width', svgWidth)
                      .attr('height', svgHeight)
                    .append('g')
                      .attr("class", "container")
                      .attr('transform', 'translate(' + (svgWidth / 2) +  ',' + (svgHeight / 2) + ')'); 


        // Define the radius
        var arc = d3.svg.arc()
                        .innerRadius(radius - donutWidth)  // Make PIE chart a Donut
                        .outerRadius(radius);



        // Define the angles
        var pie = d3.layout.pie()
                    .value(function(d) {
                      return d.count;
                    });


        // Define the Tooltip
        var tooltip = d3.select('#chart')            
                        .append('div')
                          .attr('class', 'tooltip');


        tooltip.append('div')
          .attr('class', 'label');

        tooltip.append('div')
          .attr('class', 'count');

        tooltip.append('div')
          .attr('class', 'percent');
         


        // Define the PIE chart          
        var path = svg.selectAll('path')
                      .data(pie(dataset))
                      .enter()
                      .append('path')
                      .attr('d', arc)
                      .attr('fill', function(d, i) { 
                        return color(d.data.label);
                      })
                      .each(function(d) { this._current = d; });


        path.on('mouseover', function(d) {

          var total = d3.sum(dataset.map(function(d) {
            return d.count;
            // return (d.enabled) ? d.count : 0;
          }));

          var percent = Math.round(1000 * d.data.count / total) / 10;

          tooltip.select('.label').html(d.data.label);

          tooltip.select('.count').html(d.data.count); 

          tooltip.select('.percent').html(percent + '%'); 

          tooltip.style('display', 'block');
        });

        path.on('mouseout', function() {
              tooltip.style('display', 'none');
            });  
      


        // Define the Legend
        var legendRectSize = 18,
            legendSpacing  = 4;              


        var legend = svg.selectAll('.legend')
                        .data(color.domain())
                        .enter()
                        .append('g')
                          .attr('class', 'legend')
                          .attr('transform', function(d, i) {

                            var height = legendRectSize + legendSpacing,
                                offset = height * color.domain().length / 2,
                                horz   = -2 * legendRectSize,
                                vert   = i * height - offset;
                            return 'translate(' + horz + ',' + vert + ')';

                          });

        // Legend Content
        legend.append('rect')
                .attr('width', legendRectSize)
                .attr('height', legendRectSize)
                .style('fill', color)
                .style('stroke', color)
                .on('click', function(label) {
                  var rect = d3.select(this);
                  var enabled = true;
                  var totalEnabled = d3.sum(dataset.map(function(d) {
                    return (d.enabled) ? 1 : 0;
                  }));
                  
                  if (rect.attr('class') === 'disabled') {
                    rect.attr('class', '');
                  } else {
                    if (totalEnabled < 2) return;
                    rect.attr('class', 'disabled');
                    enabled = false;
                  }

                  pie.value(function(d) {
                    if (d.label === label) d.enabled = enabled;
                    return (d.enabled) ? d.count : 0;
                  });

                  path = path.data(pie(dataset));

                  path.transition()
                    .duration(750)
                    .attrTween('d', function(d) {
                      var interpolate = d3.interpolate(this._current, d);
                      this._current = interpolate(0);
                      return function(t) {
                        return arc(interpolate(t));
                      };
                    });

                });

        legend.append('text')
                .attr('x', legendRectSize + legendSpacing)
                .attr('y', legendRectSize - legendSpacing)
                .text(function(d) { return d; });
      }
    };
  });
