
# x and y scale 
x = null
y = null

# canvas size
w = 1600
h = 1600

duration = 1500

platforms = null
genres = null
ages = null
platform_genre_nodes = null

svg = null
 
color = d3.scale.category10!

line = d3.svg.line! .interpolate \basis .x (d) -> x d.date
        .y (d) -> y d[2]

area = d3.svg.area! .interpolate \basis .x (d) -> x d.date
        .y (d) -> y d[2]

axis = d3.svg.line! .interpolate \basis .x (d) -> d.date
        .y h

xAxis = null

fill_missing_playing_time = (data, all_play_time, key_parser) ->

    # fill missing play time in log grouping data
    do
        p <- data.forEach
        newvalue = []
        all_play_time_base = 0
        p.values.forEach (d, i) ->
            while all_play_time_base < all_play_time.Data.length and d[0] != all_play_time.Data[all_play_time_base][0] + \.000
                newvalue.push [all_play_time.Data[all_play_time_base][0], key_parser(p.key), 0]
                all_play_time_base++
            all_play_time_base++
            newvalue.push d

        if newvalue.length != 720
            while all_play_time_base < all_play_time.Data.length
                newvalue.push [all_play_time.Data[all_play_time_base][0], key_parser(p.key), 0]
                all_play_time_base++

        p.values = newvalue

getancestors = (node) ->
    path = []
    current = node

    while current.parent
        path.unshift current
        current = current.parent
    path

buildhierarchy = (json) ->

    root = {"name": "root", "children": []}

    for i from 0 to json.Data.length by 1
        if json.Data[i] is void
            break
        size = json.Data[i][2]

        currentNode = root
        for j from 0 to 1 by 1
            children = currentNode["children"]
            nodeName = json.Data[i][j]
            childNode = null

            if j == 0
                foundChild = false            
                for k from 0 to children.length - 1 by 1
                    if children[k]["name"] is nodeName
                        childNode = children[k]
                        foundChild = true
                        break
                if not foundChild
                    childNode = {"name": nodeName, "children": []}
                    children.push(childNode)
                
                currentNode = childNode 
            else
                childNode = {"name": nodeName, "size": size}
                children.push(childNode)

    root

draw_platform_genre_analysis = ->

    error, json <- d3.json \log_group_by_platform_genre.json
    if error
        return console.warn error

    platform_genre_nodes := buildhierarchy json
    platform_genre_analysis_arcs!

platform_genre_analysis_arcs = ->

    w = 1000
    h = 1000

    radius = Math.min(w, h) / 2

    partition = d3.layout.partition!
        .size [2 * Math.PI, radius * radius]
        .value (d) -> d.size

    arc = d3.svg.arc!
        .startAngle (d) -> d.x
        .endAngle (d) -> d.x + d.dx
        .innerRadius (d) -> Math.sqrt d.y
        .outerRadius (d) -> Math.sqrt(d.y + d.dy)

    nodes = partition.nodes platform_genre_nodes
        .filter (d) -> d.dx > 0.005

    vis = svg.append \g .attr \id, \container .attr \transform, "translate(#{w / 2 + 300}, #{h / 2})"

    total_size = null

    inspector = d3.select \body .append \div .attr \class, \inspector .style \opacity, 0
        .style \width, \400px
        .style \height, \200px
        .style \color, \#666
        .style \position, \absolute
        .style \left, "#{w / 2 + 120}px"
        .style \top, "#{h / 2 + 100}px"
        .style \text-align, \center
        .style \background, \#FAF9F0

    inspector.append \span .attr \id, \percentage .style \color, \#666
        .style \font-size, \1.5em

    mouseover = (d) ->

        sequence_array = getancestors d

        percentage = (100 * d.value / total_size) .toPrecision 3
        percentageString = percentage + "%"

        if percentage < 0.1
            percentageString = "< 0.1%"

        path_string = ''
        if sequence_array.length > 0
            path_string += sequence_array[0].name 

            if sequence_array.length > 1
                path_string += ' && song type ' + sequence_array[1].name
        /* 
        for i from 0 to sequence_array.length - 1 by 1
            path_string += sequence_array[i].name 
            if i < sequence_array.length - 1
                path_string += \>>
        */

        d3.select \#percentage .text path_string + ": " + percentageString

        inspector.transition! .duration 200 .style \opacity, 0.9

        d3.selectAll \path .style \opacity, 0.3
        vis.selectAll \path
            .filter (node) ->
                sequence_array.indexOf(node) >= 0
            .style \opacity, 1

    colors = d3.scale .ordinal! .domain (<[Mac Windows Android iPhone Unknown]> .concat [1 to 50])
        .range (colorbrewer.RdBu[9] .concat colorbrewer.YlGn[9] .concat colorbrewer.YlOrRd[9] .concat colorbrewer.Greens[9])


    path = vis.data [platform_genre_nodes] .selectAll \path
        .data nodes
        .enter! .append \svg:path
        .attr \display, (d) ->
            if d.depth > 0 then null else \none
        .attr \d, arc
        .attr \fill-rule, \evenodd
        .style \fill, (d) -> colors(d.name)
        .style \opacity, 1
        .on \mouseover, mouseover

    total_size = path.node! .__data__.value


draw_age_analysis = ->

    error, json <- d3.json \log_group_by_hour_age.json
    if error
        return console.warn error

    error, all_play_time <- d3.json \distinct_play_time.json

    time_parser = d3.time.format '%Y-%m-%d %X.000' .parse
    ages := d3.nest! .key (d) -> d[1]
                .entries json.Data

    fill_missing_playing_time ages, all_play_time, (key) -> key

    do
        p <- ages.forEach
        p.values.forEach (d) -> d.date = time_parser d[0]
        p.maxCount = d3.max p.values, (d) -> d[2]
        p.minCount = d3.min p.values, (d) -> d[2]

    ages.sort (a, b) -> b.maxCount - a.maxCount
    svg.selectAll \g .data ages .enter! .append \g .attr \class, \age
    age_analysis_stakced_areas!

age_analysis_stakced_areas = ->

    stack = d3.layout.stack!
        .values (d) -> d.values
        .x (d) -> d.date
        .y (d) -> d[2]
        .out (d, y0, y) -> d.count0 = y0
        .order \reverse

    stack ages

    x := d3.time.scale! .range [10, w - 60]

    x.domain [
        d3.min ages, (d) -> d.values[0].date
        d3.max ages, (d) -> d.values[d.values.length - 1].date
    ]

    xAxis := d3.svg.axis! .scale x .orient("bottom") .ticks(30) .tickSize(2000)


    y .domain [0, d3.max ages[0].values.map (d) -> d[2] + d.count0]
      .range [h + 380, 0]

    line .y (d) -> y d.count0
    area .y0 (d) -> y d.count0
        .y1 (d) -> y d.count0 + d[2]

    t = svg.selectAll \.age .transition!
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

 
draw_genre_analysis = ->

    error, json <- d3.json \log_group_by_hour_genre.json
    if error
        return console.warn error

    error, all_play_time <- d3.json \distinct_play_time.json

    time_parser = d3.time.format '%Y-%m-%d %X.000' .parse
    genres := d3.nest! .key (d) -> d[1]
                .entries json.Data

    fill_missing_playing_time genres, all_play_time, (key) -> parseInt(key)

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

    line .y (d) -> y d[2]
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
        case \age then draw_age_analysis!
        case \platform_genre then draw_platform_genre_analysis!


<- $ document .ready 
 
do ->
    svg := d3.select \#d3-canvas .append \svg
        .attr \width  2000
        .attr \height 4000

    draw_platform_analysis!

        


   
