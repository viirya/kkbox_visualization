var app;
app = angular.module('kkbox-vis', ['ngRoute', 'ngResource', 'ngAnimate']);
app.controller('KKBOXCtrl', function($scope, $resource){});
$(document).ready(function(){
  var x, y, w, h, platforms, svg, color, line, area, axis, xAxis, lines;
  x = null;
  y = null;
  w = 2000;
  h = 1600;
  platforms = null;
  svg = null;
  color = d3.scale.category10();
  line = d3.svg.line().interpolate('basis').x(function(d){
    return x(d.date);
  }).y(function(d){
    return y(d[2]);
  });
  area = d3.svg.area().interpolate('basis').x(function(d){
    return x(d.date);
  }).y(function(d){
    return y(d[2]);
  });
  axis = d3.svg.line().interpolate('basis').x(function(d){
    return d.date;
  }).y(h);
  xAxis = null;
  (function(){
    svg = d3.select('#d3-canvas').append('svg').attr('width', 2000).attr('height', 4000);
    return d3.json('log_group_by_hour_platform.json', function(error, json){
      var time_parser;
      if (error) {
        return console.warn(error);
      }
      time_parser = d3.time.format('%Y-%m-%d %X.000').parse;
      platforms = d3.nest().key(function(d){
        return d[1];
      }).entries(json.Data);
      platforms.forEach(function(p){
        p.values.forEach(function(d){
          return d.date = time_parser(d[0]);
        });
        p.maxCount = d3.max(p.values, function(d){
          return d[2];
        });
        return p.minCount = d3.min(p.values, function(d){
          return d[2];
        });
      });
      platforms.sort(function(a, b){
        return b.maxCount - a.maxCount;
      });
      svg.selectAll('g').data(platforms).enter().append('g').attr('class', 'platform');
      return lines();
    });
  })();
  return lines = function(){
    var g, drawLines, k, n;
    console.log(platforms);
    x = d3.time.scale().range([10, w - 60]);
    y = d3.scale.linear().range([h / 4 - 20, 0]);
    x.domain([
      d3.min(platforms, function(d){
        return d.values[0].date;
      }), d3.max(platforms, function(d){
        return d.values[d.values.length - 1].date;
      })
    ]);
    xAxis = d3.svg.axis().scale(x).orient("bottom").ticks(30).tickSize(2000);
    g = svg.selectAll('.platform').attr('transform', function(d, i){
      return "translate(10, " + (i * h / 4 + 10) + ")";
    });
    g.each(function(d){
      var e;
      e = d3.select(this);
      e.append('path').attr('class', 'line');
      e.append('circle').attr('r', 5).style('fill', function(d){
        return color(d.key);
      }).style('stroke', '#000').style('stroke-width', '2px');
      return e.append('text').attr('x', 12).attr('dy', '.31em').text(function(d){
        return d.key;
      });
    });
    svg.append('g').attr('class', "x axis").attr('transform', "translate(10, 0})").call(xAxis);
    drawLines = function(k){
      return g.each(function(d){
        var e;
        e = d3.select(this);
        y.domain([0, d.maxCount]);
        e.select('path').attr('d', function(d){
          return line(d.values.slice(0, k + 1));
        });
        return e.selectAll("circle, text").data(function(){
          return [d.values[k], d.values[k]];
        }).attr('transform', function(d){
          return "translate(" + x(d.date) + ", " + y(d[2]) + ")";
        });
      });
    };
    k = 1;
    n = platforms[0].values.length;
    return d3.timer(function(){
      drawLines(k);
      if ((k += 2) >= n - 1) {
        drawLines(n - 1);
        return true;
      }
    });
  };
});