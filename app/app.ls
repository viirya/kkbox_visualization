
# x and y scale 
x = null
y = null

# canvas size
w = 2000
h = 1600

duration = 1500

platforms = null
genres = null
svg = null
 
color = d3.scale.category10!

line = d3.svg.line! .interpolate \basis .x (d) -> x d.date
        .y (d) -> y d[2]

area = d3.svg.area! .interpolate \basis .x (d) -> x d.date
        .y (d) -> y d[2]

axis = d3.svg.line! .interpolate \basis .x (d) -> d.date
        .y h

xAxis = null

draw_genre_analysis = ->

    error, json <- d3.json \log_group_by_hour_genre.json
    if error
        return console.warn error

    error, all_play_time <- d3.json \distinct_play_time.json

    time_parser = d3.time.format '%Y-%m-%d %X.000' .parse
    genres := d3.nest! .key (d) -> d[1]
                .entries json.Data

    # fill missing play time in log grouping data
    do
        p <- genres.forEach
        newvalue = []
        all_play_time_base = 0
        p.values.forEach (d, i) ->
            while all_play_time_base < all_play_time.Data.length and d[0] != all_play_time.Data[all_play_time_base][0] + \.000
                newvalue.push [all_play_time.Data[all_play_time_base][0], parseInt(p.key), 0]
                all_play_time_base++
            all_play_time_base++
            newvalue.push d

        if newvalue.length != 720
            while all_play_time_base < all_play_time.Data.length
                newvalue.push [all_play_time.Data[all_play_time_base][0], parseInt(p.key), 0]
                all_play_time_base++

        p.values = newvalue

    do
        p <- genres.forEach
        p.values.forEach (d) -> d.date = time_parser d[0]
        p.maxCount = d3.max p.values, (d) -> d[2]
        p.minCount = d3.min p.values, (d) -> d[2]
    
    genres.sort (a, b) -> b.maxCount - a.maxCount
    
    svg.selectAll \g .data genres .enter! .append \g .attr \class, \genre
    genre_analysis_stakced_areas!

genre_analysis_stakced_areas = ->

    stack = d3.layout.stack!
        .values (d) -> d.values
        .x (d) -> d.date
        .y (d) -> d[2]
        .out (d, y0, y) -> d.count0 = y0
        .order \reverse

    stack genres

    x := d3.time.scale! .range [10, w - 60]

    x.domain [
        d3.min genres, (d) -> d.values[0].date
        d3.max genres, (d) -> d.values[d.values.length - 1].date
    ]

    xAxis := d3.svg.axis! .scale x .orient("bottom") .ticks(30) .tickSize(2000)


    y .domain [0, d3.max genres[0].values.map (d) -> d[2] + d.count0]
      .range [h + 380, 0]

    line .y (d) -> y d.count0
    area .y0 (d) -> y d.count0
        .y1 (d) -> y d.count0 + d[2]

    t = svg.selectAll \.genre .transition!
        .duration duration
        .attr \transform, "translate(0,0)"
        .each \end, -> d3.select @ .attr "transform", null

    t.each (d) ->
        e = d3.select @
        e.append \path .attr \class, \line
        e.append \text .attr \x, 12 .attr \dy, \.31em .text (d) -> d.key
        e.insert \path, \.line .attr \class, \area .style \fill, color d.key .attr \d, (d) -> area d.values

    t.select \path.area
        .attr \d, (d) -> area d.values

    t.select \path.line
        .style \stroke-opacity, (d, i) -> return i < 3 ? 1e-6 : 1
        .attr \d, (d) -> line d.values

    t.select \text
        .attr \transform, (d) ->
            d = d.values[d.values.length - 1]
            "translate(#{w - 60}, #{y(d[2] / 2 + d.count0)})"

    svg.append \g .attr \class, "x axis" .attr \transform, "translate(10, 0)"
            .call xAxis


draw_platform_analysis = ->

    error, json <- d3.json \log_group_by_hour_platform.json
    if error
        return console.warn error
    
    time_parser = d3.time.format '%Y-%m-%d %X.000' .parse
    platforms := d3.nest! .key (d) -> d[1]
                .entries json.Data
    
    do
        p <- platforms.forEach
        p.values.forEach (d) -> d.date = time_parser d[0]
        p.maxCount = d3.max p.values, (d) -> d[2]
        p.minCount = d3.min p.values, (d) -> d[2]
    
    platforms.sort (a, b) -> b.maxCount - a.maxCount
    
    svg.selectAll \g .data platforms .enter! .append \g .attr \class, \platform
    platform_analysis_lines!

platform_analysis_lines = ->
    x := d3.time.scale! .range [10, w - 60]
    y := d3.scale.linear! .range [h / 4 - 20, 0]

    x.domain [
        d3.min platforms, (d) -> d.values[0].date
        d3.max platforms, (d) -> d.values[d.values.length - 1].date
    ]

    xAxis := d3.svg.axis! .scale x .orient("bottom") .ticks(30) .tickSize(2000)

    g = svg.selectAll \.platform .attr \transform, (d, i) -> "translate(10, #{i * h / 4 + 10})"  
    g.each (d) ->
        e = d3.select @
        e.append \path .attr \class, \line
        e.append \circle .attr \r, 5 .style \fill, (d) -> color d.key
            .style \stroke, \#000
            .style \stroke-width, \2px

        e.append \text .attr \x, 12 .attr \dy, \.31em .text (d) -> d.key

    svg.append \g .attr \class, "x axis" .attr \transform, "translate(10, 0)"
            .call xAxis

    drawLines = (k) ->
        g.each (d) ->
            e = d3.select @
            y.domain [0, d.maxCount]
            e.select \path .attr \d, (d) -> line d.values.slice 0, k + 1
            e.selectAll "circle, text" .data  -> [d.values[k], d.values[k]] 
                .attr \transform, (d) -> "translate(#{x d.date}, #{y d[2]})"

    k = 1
    n = platforms[0].values.length
    d3.timer ->
        drawLines k
        if (k += 2) >= n - 1
            drawLines n - 1
            true
 
app = angular.module \kkbox-vis, <[ngRoute ngResource ngAnimate]>

do
    $scope, $resource <- app.controller \KKBOXCtrl, _

    $scope.click_viewtype = (view_type) ->

        if svg then svg.selectAll \* .remove!

        switch view_type
        case \platform then draw_platform_analysis!
        case \genre then draw_genre_analysis!


<- $ document .ready 
 
do ->
    svg := d3.select \#d3-canvas .append \svg
        .attr \width  2000
        .attr \height 4000

    draw_platform_analysis!

        


   
