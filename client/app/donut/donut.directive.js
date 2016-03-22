'use strict';

angular.module('redreapApp')
  .directive('donut', function (User) {
    return {
      template: '<div></div>',
      restrict: 'EA',
      link: function (scope, element, attrs) {
        var data = User.getUserData().data;
        var curAction = attrs.title;
        var color = d3.scale.ordinal();
        console.log(attrs);

        var svgWidth  = 375,
            svgHeight = 375,
            radius = Math.min(svgWidth, svgHeight) / 2,
            donutWidth = 60;

        if (curAction == "Comment")
        {
          /* Positive/Negative of Comments */
          var dataset = [
            { label: 'Other', count: 100 - data.negativePercentage, enabled: true }, 
            { label: 'Negative', count: Math.round(data.negativePercentage*100)/100, enabled: true },
          ];

          color.range(['#5D5D5D','#EA1C1C','#BE2929','#D22E2E','#D74343','#DB5858','#E06D6D']); 
        }
        else if (curAction == "Adjective")
        {
          /* Positive/Negative of Adjectives */
          var dataset = [
            { label: 'Very Positive', count: data.vpPer, enabled: true },
            { label: 'Positive', count: data.pPer, enabled: true }, 
            { label: 'Negative', count: data.nPer, enabled: true },
            { label: 'Very Negative', count: data.vnPer, enabled: true },
          ];

          color.range(['#1B9F9F','#1CEAEA','#EA1C1C','#9F1B1B','#D74343','#DB5858','#E06D6D']); 
        }
        else if (curAction == "Subreddit")
        {
          var curIndex = attrs.curIndex;

            if (curIndex != 0)
            {
              svgWidth  = 250,
              svgHeight = 250,
              radius = Math.min(svgWidth, svgHeight) / 2,
              donutWidth = 35;
            }

          var totalSentences = (data.sentimentBySub[curIndex].positiveCount + data.sentimentBySub[curIndex].neutralCount + data.sentimentBySub[curIndex].negativeCount);

          var positivePercent = Math.round(data.sentimentBySub[curIndex].positiveCount*100 / totalSentences);
          var neutralPercent = Math.round(data.sentimentBySub[curIndex].neutralCount*100 / totalSentences);
          var negativePercent = Math.round(data.sentimentBySub[curIndex].negativeCount*100 / totalSentences);


          /* Positive/Negative of Adjectives */
          var dataset = [
            { label: 'Positive', count: positivePercent, enabled: true },
            { label: 'Neutral', count: neutralPercent, enabled: true }, 
            { label: 'Negative', count: negativePercent, enabled: true },
          ];

          color.range(['#1CEAEA','#5D5D5D','#EA1C1C','#9F1B1B','#D74343','#DB5858','#E06D6D']); 
        }

        //var color = d3.scale.category10();    
     
        var tip = d3.tip()
          .attr('class', 'd3-tip')
          .html(function(d) {
            return "<strong>" + d.data.label + "</strong> <span style='color:red'>" + d.data.count + "%</span>";
          });

        var svg = d3.select(element[0])
                    .append('svg')
                      .attr('width', svgWidth)
                      .attr('height', svgHeight)
                    .append('g')
                      .attr("class", "container")
                      .attr('transform', 'translate(' + (svgWidth / 2) +  ',' + (svgHeight / 2) + ')'); 

        svg.call(tip);
        // Define the radius
        var arc = d3.svg.arc()
                        .innerRadius(radius - donutWidth)
                        .outerRadius(radius);


        // Define the angles
        var pie = d3.layout.pie()
                    .value(function(d) {
                      return d.count;
                    })
                    .sort(null);
        // Define the PIE chart          
        var path = svg.selectAll('path')
                      .data(pie(dataset))
                      .enter()
                      .append('path')
                      .attr('d', arc)
                      .attr('fill', function(d, i) { 
                        return color(d.data.label);
                      })
                      .on('mouseover', tip.show)
                      .on('mouseout', tip.hide)
                      .each(function(d) { this._current = d; });

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
                    rect.attr('class', '')
                    .style('fill', color);
                  } else {
                    if (totalEnabled < 2) return;
                    rect.attr('class', 'disabled')
                    rect.style('fill', "gray");
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
