
app = angular.module \kkbox-vis, <[ngRoute ngResource ngAnimate]>

do
    $scope, $resource <- app.controller \KKBOXCtrl, _

<- $ document .ready 

do ->
    svg = d3.select \#d3-canvas .append \svg
        .attr \width  1200
        .attr \height 4000

    window.container = container = svg.append \g
        .attr \transform "translate(0, 0)"

    do
        error, json <- d3.json \log_group_by_hour_platform.json
        if error
            return console.warn error

        time_parser = d3.time.format '%Y-%m-%d %X.000' .parse
        platforms = d3.nest! .key (d) -> d[1]
                    .entries json.Data

        do
            p <- platforms.forEach
            p.values.forEach (d) -> d.date = time_parser d[0]
            p.maxCount = d3.max p.values, (d) -> d[2]
            p.minCount = d3.min p.values, (d) -> d[2]

        platforms.sort (a, b) -> b.maxCount - a.maxCount

        svg.selectAll \g .data platforms .enter! .append \g

        console.log platforms

