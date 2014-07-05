
app = angular.module \kkbox-vis, <[ngRoute ngResource ngAnimate]>

do
    $scope, $resource <- app.controller \KKBOXCtrl, _

    $scope.click_viewtype = (view_type) ->

        switch view_type
        case \platform then console.log \platform
        case \genre then console.log \genre


<- $ document .ready 

x = null
y = null
w = 2000
h = 1600

platforms = null
svg = null

color = d3.scale.category10!

line = d3.svg.line! .interpolate \basis .x (d) -> x d.date
        .y (d) -> y d[2]

area = d3.svg.area! .interpolate \basis .x (d) -> x d.date
        .y (d) -> y d[2]

axis = d3.svg.line! .interpolate \basis .x (d) -> d.date
        .y h

xAxis = null


do ->
    svg := d3.select \#d3-canvas .append \svg
        .attr \width  2000
        .attr \height 4000

    #window.container = container = svg.append \g
    #    .attr \transform "translate(0, 0)"

    do
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
        lines!

lines = ->
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

    svg.append \g .attr \class, "x axis" .attr \transform, "translate(10, 0})"
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
        


   
