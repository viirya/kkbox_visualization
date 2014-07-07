var x, y, w, h, duration, platforms, genres, svg, color, line, area, axis, xAxis, draw_genre_analysis, genre_analysis_stakced_areas, draw_platform_analysis, platform_analysis_lines, app;
x = null;
y = null;
w = 2000;
h = 1600;
duration = 1500;
platforms = null;
genres = null;
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
draw_genre_analysis = function(){
  return d3.json('log_group_by_hour_genre.json', function(error, json){
    if (error) {
      return console.warn(error);
    }
    return d3.json('distinct_play_time.json', function(error, all_play_time){
      var time_parser;
      time_parser = d3.time.format('%Y-%m-%d %X.000').parse;
      genres = d3.nest().key(function(d){
        return d[1];
      }).entries(json.Data);
      genres.forEach(function(p){
        var newvalue, all_play_time_base;
        newvalue = [];
        all_play_time_base = 0;
        p.values.forEach(function(d, i){
          while (all_play_time_base < all_play_time.Data.length && d[0] !== all_play_time.Data[all_play_time_base][0] + '.000') {
            newvalue.push([all_play_time.Data[all_play_time_base][0], parseInt(p.key), 0]);
            all_play_time_base++;
          }
          all_play_time_base++;
          return newvalue.push(d);
        });
        if (newvalue.length !== 720) {
          while (all_play_time_base < all_play_time.Data.length) {
            newvalue.push([all_play_time.Data[all_play_time_base][0], parseInt(p.key), 0]);
            all_play_time_base++;
          }
        }
        return p.values = newvalue;
      });
      genres.forEach(function(p){
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
      genres.sort(function(a, b){
        return b.maxCount - a.maxCount;
      });
      svg.selectAll('g').data(genres).enter().append('g').attr('class', 'genre');
      return genre_analysis_stakced_areas();
    });
  });
};
genre_analysis_stakced_areas = function(){
  var stack, t;
  stack = d3.layout.stack().values(function(d){
    return d.values;
  }).x(function(d){
    return d.date;
  }).y(function(d){
    return d[2];
  }).out(function(d, y0, y){
    return d.count0 = y0;
  }).order('reverse');
  stack(genres);
  x = d3.time.scale().range([10, w - 60]);
  x.domain([
    d3.min(genres, function(d){
      return d.values[0].date;
    }), d3.max(genres, function(d){
      return d.values[d.values.length - 1].date;
    })
  ]);
  xAxis = d3.svg.axis().scale(x).orient("bottom").ticks(30).tickSize(2000);
  y.domain([
    0, d3.max(genres[0].values.map(function(d){
      return d[2] + d.count0;
    }))
  ]).range([h + 380, 0]);
  line.y(function(d){
    return y(d.count0);
  });
  area.y0(function(d){
    return y(d.count0);
  }).y1(function(d){
    return y(d.count0 + d[2]);
  });
  t = svg.selectAll('.genre').transition().duration(duration).attr('transform', "translate(0,0)").each('end', function(){
    return d3.select(this).attr("transform", null);
  });
  t.each(function(d){
    var e;
    e = d3.select(this);
    e.append('path').attr('class', 'line');
    e.append('text').attr('x', 12).attr('dy', '.31em').text(function(d){
      return d.key;
    });
    return e.insert('path', '.line').attr('class', 'area').style('fill', color(d.key)).attr('d', function(d){
      return area(d.values);
    });
  });
  t.select('path.area').attr('d', function(d){
    return area(d.values);
  });
  t.select('path.line').style('stroke-opacity', function(d, i){
    var ref$;
    return (ref$ = i < 3) != null
      ? ref$
      : {
        1e-6: 1
      };
  }).attr('d', function(d){
    return line(d.values);
  });
  t.select('text').attr('transform', function(d){
    d = d.values[d.values.length - 1];
    return "translate(" + (w - 60) + ", " + y(d[2] / 2 + d.count0) + ")";
  });
  return svg.append('g').attr('class', "x axis").attr('transform', "translate(10, 0)").call(xAxis);
};
draw_platform_analysis = function(){
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
    return platform_analysis_lines();
  });
};
platform_analysis_lines = function(){
  var g, drawLines, k, n;
  x = d3.time.scale().range([10, w - 60]);
  y = d3.scale.linear().range([h / 4 - 20, 0]);
  x.domain([
    d3.min(platforms, function(d){
      return d.values[0].date;
    }), d3.max(platforms, function(d){
      return d.values[d.values.length - 1].date;
    })
  ]);
  line.y(function(d){
    return y(d[2]);
  });
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
  svg.append('g').attr('class', "x axis").attr('transform', "translate(10, 0)").call(xAxis);
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
app = angular.module('kkbox-vis', ['ngRoute', 'ngResource', 'ngAnimate']);
app.controller('KKBOXCtrl', function($scope, $resource){
  return $scope.click_viewtype = function(view_type){
    if (svg) {
      svg.selectAll('*').remove();
    }
    switch (view_type) {
    case 'platform':
      return draw_platform_analysis();
    case 'genre':
      return draw_genre_analysis();
    }
  };
});
$(document).ready(function(){
  return function(){
    svg = d3.select('#d3-canvas').append('svg').attr('width', 2000).attr('height', 4000);
    return draw_platform_analysis();
  }();
});