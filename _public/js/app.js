var x, y, w, h, duration, platforms, genres, ages, platform_genre_nodes, svg, color, line, area, axis, xAxis, fill_missing_playing_time, getancestors, buildhierarchy, draw_platform_genre_analysis, platform_genre_analysis_arcs, draw_age_analysis, age_analysis_stakced_areas, draw_genre_analysis, genre_analysis_stakced_areas, draw_platform_analysis, platform_analysis_lines, app;
x = null;
y = null;
w = 1600;
h = 1600;
duration = 1500;
platforms = null;
genres = null;
ages = null;
platform_genre_nodes = null;
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
fill_missing_playing_time = function(data, all_play_time, key_parser){
  return data.forEach(function(p){
    var newvalue, all_play_time_base;
    newvalue = [];
    all_play_time_base = 0;
    p.values.forEach(function(d, i){
      while (all_play_time_base < all_play_time.Data.length && d[0] !== all_play_time.Data[all_play_time_base][0] + '.000') {
        newvalue.push([all_play_time.Data[all_play_time_base][0], key_parser(p.key), 0]);
        all_play_time_base++;
      }
      all_play_time_base++;
      return newvalue.push(d);
    });
    if (newvalue.length !== 720) {
      while (all_play_time_base < all_play_time.Data.length) {
        newvalue.push([all_play_time.Data[all_play_time_base][0], key_parser(p.key), 0]);
        all_play_time_base++;
      }
    }
    return p.values = newvalue;
  });
};
getancestors = function(node){
  var path, current;
  path = [];
  current = node;
  while (current.parent) {
    path.unshift(current);
    current = current.parent;
  }
  return path;
};
buildhierarchy = function(json){
  var root, i$, to$, i, size, currentNode, j$, j, children, nodeName, childNode, foundChild, k$, to1$, k;
  root = {
    "name": "root",
    "children": []
  };
  for (i$ = 0, to$ = json.Data.length; i$ <= to$; ++i$) {
    i = i$;
    if (json.Data[i] === void 8) {
      break;
    }
    size = json.Data[i][2];
    currentNode = root;
    for (j$ = 0; j$ <= 1; ++j$) {
      j = j$;
      children = currentNode["children"];
      nodeName = json.Data[i][j];
      childNode = null;
      if (j === 0) {
        foundChild = false;
        for (k$ = 0, to1$ = children.length - 1; k$ <= to1$; ++k$) {
          k = k$;
          if (children[k]["name"] === nodeName) {
            childNode = children[k];
            foundChild = true;
            break;
          }
        }
        if (!foundChild) {
          childNode = {
            "name": nodeName,
            "children": []
          };
          children.push(childNode);
        }
        currentNode = childNode;
      } else {
        childNode = {
          "name": nodeName,
          "size": size
        };
        children.push(childNode);
      }
    }
  }
  return root;
};
draw_platform_genre_analysis = function(){
  return d3.json('log_group_by_platform_genre.json', function(error, json){
    if (error) {
      return console.warn(error);
    }
    platform_genre_nodes = buildhierarchy(json);
    return platform_genre_analysis_arcs();
  });
};
platform_genre_analysis_arcs = function(){
  var w, h, radius, partition, arc, nodes, vis, total_size, inspector, mouseover, colors, path;
  w = 1000;
  h = 1000;
  radius = Math.min(w, h) / 2;
  partition = d3.layout.partition().size([2 * Math.PI, radius * radius]).value(function(d){
    return d.size;
  });
  arc = d3.svg.arc().startAngle(function(d){
    return d.x;
  }).endAngle(function(d){
    return d.x + d.dx;
  }).innerRadius(function(d){
    return Math.sqrt(d.y);
  }).outerRadius(function(d){
    return Math.sqrt(d.y + d.dy);
  });
  nodes = partition.nodes(platform_genre_nodes).filter(function(d){
    return d.dx > 0.005;
  });
  vis = svg.append('g').attr('id', 'container').attr('transform', "translate(" + (w / 2 + 300) + ", " + h / 2 + ")");
  total_size = null;
  inspector = d3.select('body').append('div').attr('class', 'inspector').style('opacity', 0).style('width', '400px').style('height', '200px').style('color', '#666').style('position', 'absolute').style('left', (w / 2 + 120) + "px").style('top', (h / 2 + 100) + "px").style('text-align', 'center').style('background', '#FAF9F0');
  inspector.append('span').attr('id', 'percentage').style('color', '#666').style('font-size', '1.5em');
  mouseover = function(d){
    var sequence_array, percentage, percentageString, path_string;
    sequence_array = getancestors(d);
    percentage = (100 * d.value / total_size).toPrecision(3);
    percentageString = percentage + "%";
    if (percentage < 0.1) {
      percentageString = "< 0.1%";
    }
    path_string = '';
    if (sequence_array.length > 0) {
      path_string += sequence_array[0].name;
      if (sequence_array.length > 1) {
        path_string += ' && song type ' + sequence_array[1].name;
      }
    }
    /* 
    for i from 0 to sequence_array.length - 1 by 1
        path_string += sequence_array[i].name 
        if i < sequence_array.length - 1
            path_string += \>>
    */
    d3.select('#percentage').text(path_string + ": " + percentageString);
    inspector.transition().duration(200).style('opacity', 0.9);
    d3.selectAll('path').style('opacity', 0.3);
    return vis.selectAll('path').filter(function(node){
      return sequence_array.indexOf(node) >= 0;
    }).style('opacity', 1);
  };
  colors = d3.scale.ordinal().domain(['Mac', 'Windows', 'Android', 'iPhone', 'Unknown'].concat([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50])).range(colorbrewer.RdBu[9].concat(colorbrewer.YlGn[9]).concat(colorbrewer.YlOrRd[9]).concat(colorbrewer.Greens[9]));
  path = vis.data([platform_genre_nodes]).selectAll('path').data(nodes).enter().append('svg:path').attr('display', function(d){
    if (d.depth > 0) {
      return null;
    } else {
      return 'none';
    }
  }).attr('d', arc).attr('fill-rule', 'evenodd').style('fill', function(d){
    return colors(d.name);
  }).style('opacity', 1).on('mouseover', mouseover);
  return total_size = path.node().__data__.value;
};
draw_age_analysis = function(){
  return d3.json('log_group_by_hour_age.json', function(error, json){
    if (error) {
      return console.warn(error);
    }
    return d3.json('distinct_play_time.json', function(error, all_play_time){
      var time_parser;
      time_parser = d3.time.format('%Y-%m-%d %X.000').parse;
      ages = d3.nest().key(function(d){
        return d[1];
      }).entries(json.Data);
      fill_missing_playing_time(ages, all_play_time, function(key){
        return key;
      });
      ages.forEach(function(p){
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
      ages.sort(function(a, b){
        return b.maxCount - a.maxCount;
      });
      svg.selectAll('g').data(ages).enter().append('g').attr('class', 'age');
      return age_analysis_stakced_areas();
    });
  });
};
age_analysis_stakced_areas = function(){
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
  stack(ages);
  x = d3.time.scale().range([10, w - 60]);
  x.domain([
    d3.min(ages, function(d){
      return d.values[0].date;
    }), d3.max(ages, function(d){
      return d.values[d.values.length - 1].date;
    })
  ]);
  xAxis = d3.svg.axis().scale(x).orient("bottom").ticks(30).tickSize(2000);
  y.domain([
    0, d3.max(ages[0].values.map(function(d){
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
  t = svg.selectAll('.age').transition().duration(duration).attr('transform', "translate(0,0)").each('end', function(){
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
      fill_missing_playing_time(genres, all_play_time, function(key){
        return parseInt(key);
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
    case 'age':
      return draw_age_analysis();
    case 'platform_genre':
      return draw_platform_genre_analysis();
    }
  };
});
$(document).ready(function(){
  return function(){
    svg = d3.select('#d3-canvas').append('svg').attr('width', 2000).attr('height', 4000);
    return draw_platform_analysis();
  }();
});