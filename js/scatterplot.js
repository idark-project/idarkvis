var fileNames = ["data/data.csv"];

/*
    For more info on the color scales used in this code, check http://gka.github.io/chroma.js/.
*/
var colorScales = [chroma.scale("OrRd"), chroma.scale(['yellow', '008ae5'])];

var data = [];
var datasets = [];

var xVar;
var yVar;

/*
    Function initializes the dropdown menus on the page to a given value
*/
function addSelect (name, keys, selected) {
    i = 0;
    keys.forEach(function(entry) {
        app = d3.select("#" + name).append("option").text(entry);
        if (selected == i){
            app.attr("selected","selected");
        }
        i++;
    });

}

function checkbox () {
    data = [];
    if (document.getElementById("mockData").checked){
        fileNames = ["data/data.csv", "data/MOCK_DATA.csv"];
    } else {
        fileNames = ["data/data.csv"];
    }
    loadDataSets(0);
}

function resetZoom () {
    drawPlot();
}

/*
    Normalises a value, such that a value in a list [min, max] becomes a value in a list [0,1]
*/
function normaliseValue (value, min, max) {
    return ((value - min)/(max - min));
}

/*
    Function gets called on pageload.
    Initializes the dropdown menus with addSelect and saves the dataset as the variable data.
    Then calls drawPlot to draw the first plot.
*/
function onPageLoad () {
    
    d3.csv(fileNames[0], function(error, dataset) {
        if (error) throw error;
        
        var keys = d3.keys(dataset[0]);
        
        addSelect("xVar", keys, 1);
        addSelect("yVar", keys, 2);
        addSelect("cVar", keys, 3);
        addSelect("rVar", keys, 4);
        
        loadDataSets(0);
    });
}

function loadDataSets (nr) {
    if (nr < fileNames.length){
        d3.csv(fileNames[nr], function(error, dataset) {
            if (error) throw error;

            for (i = 0; i<dataset.length; i++){
                dataset[i]["setNr"] = nr;
                data[data.length] = dataset[i];
            }
            
            datasets[nr] = dataset;

            loadDataSets(nr+1);
        });
    } else {
        drawPlot();
    }
}

function maxOfDataSet (nr, variable){
    return d3.max(data, function(d) {
        if (d.setNr == nr){return d[variable];}
    });
}

function minOfDataSet (nr, variable){
    return d3.min(data, function(d) {
        if (d.setNr == nr){return d[variable];}
    });
}

/*
    Initializing steps for the scatterplot.
*/
var margin = {top: 20, right: 20, bottom: 30, left: 40},
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

var x = d3.scale.linear()
    .range([0, width]);

var y = d3.scale.linear()
    .range([height, 0]);

/*
    Because of defining the tickFormat as "g", big/small numbers get converted to scientific notation.
    For more information: https://github.com/d3/d3/wiki/Formatting
*/
var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom")
    .tickFormat(d3.format("g"));

var yAxis = d3.svg.axis()
    .scale(y)
    .orient("left")
    .tickFormat(d3.format("g"));

/*
    Every time this function gets called (at pageload and when selecting a new variable), a new plot gets generated.
*/
function drawPlot() {

    d3.select(".plot").select("svg").remove();
    d3.select(".downloads").selectAll("a").remove();

    for (i = 0; i<fileNames.length; i++){
        d3.select(".downloads").append("a")
            .attr("href", fileNames[i])
            .attr("id", fileNames[i])
            .attr("hidden", true);
    }

    /*
        Looks at the dropdown menus and saves their values, so that these values can be looked up in the dataset.
    */
    var xSelect = document.getElementById("xVar");
    var ySelect = document.getElementById("yVar");
    var cSelect = document.getElementById("cVar");
    var rSelect = document.getElementById("rVar");

    xVar = xSelect.options[xSelect.selectedIndex].value;
    yVar = ySelect.options[ySelect.selectedIndex].value;
    var cVar = cSelect.options[cSelect.selectedIndex].value;
    var rVar = rSelect.options[rSelect.selectedIndex].value;
    
    data.forEach(function(d) {
        d[xVar] = +d[xVar];
        d[yVar] = +d[yVar];
        d[cVar] = +d[cVar];
        d[rVar] = +d[rVar];
    });

    zoom = d3.behavior.zoom().x(x).y(y).on("zoom", refresh);
    
    function mousedown () {
        var e = this,
        origin = d3.mouse(e),
        rect = svg.append("rect").attr("class", "zoom");
        
        d3.select("body").classed("noselect", true);
        origin[0] = Math.max(0, Math.min(width, origin[0]));
        origin[1] = Math.max(0, Math.min(height, origin[1]));
        d3.select(window)
            .on("mousemove.zoomRect", function() {
                var m = d3.mouse(e);
                m[0] = Math.max(0, Math.min(width, m[0]));
                m[1] = Math.max(0, Math.min(height, m[1]));
                rect.attr("x", Math.min(origin[0], m[0]))
                    .attr("y", Math.min(origin[1], m[1]))
                    .attr("width", Math.abs(m[0] - origin[0]))
                    .attr("height", Math.abs(m[1] - origin[1]));
            })
            .on("mouseup.zoomRect", function() {
                d3.select(window).on("mousemove.zoomRect", null).on("mouseup.zoomRect", null);
                d3.select("body").classed("noselect", false);
                var m = d3.mouse(e);
                m[0] = Math.max(0, Math.min(width, m[0]));
                m[1] = Math.max(0, Math.min(height, m[1]));
                if (m[0] !== origin[0] && m[1] !== origin[1]) {
                    zoom.x(x.domain([origin[0], m[0]].map(x.invert).sort()))
                        .y(y.domain([origin[1], m[1]].map(y.invert).sort()));
                }
                rect.remove();
                refresh();
            }, true);
        d3.event.stopPropagation();
    }

    /*
        Applies margins and width/height to plot svg.
    */
    var svg = d3.select(".plot").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .on("mousedown", mousedown);

    svg.append("rect")
        .attr("width", width)
        .attr("height", height);

    function refresh() {
        svg.select(".x.axis").call(xAxis);
        svg.select(".y.axis").call(yAxis);
        svg.selectAll(".dot")
            .filter(function(d) { return !(d[xVar] > x.domain()[0] && d[xVar] < x.domain()[1] 
                && d[yVar] > y.domain()[0] && d[yVar] < y.domain()[1]); })
            .remove();
        svg.selectAll(".dot")
            .attr("transform", transform);
        svg.selectAll("text").attr("class","unselectable")
    }

    function transform(d) {
        return "translate(" + x(d[xVar]) + "," + y(d[yVar]) + ")";
    }

    /*
        Saves the tooltip and chernoff div, because we'll need it later.
    */
    var tooltip = d3.select(".tooltip");
    var chernoffSVG = d3.select(".face").select("svg");

    var c = d3.chernoff()
            .face(function(d) { return d.f; })
            .mouth(function(d) { return d.m; })
            .nosew(function(d) { return d.nw; })
            .noseh(function(d) { return d.nh; })
            .eyew(function(d) { return d.ew; })
            .eyeh(function(d) { return d.eh; })
            .brow(function(d) { return d.b; });

    /*
        Computes the domains of the variables, so that it can construct x and y axis.
    */
    x.domain(d3.extent(data, function(d) { return d[xVar]; })).nice();
    y.domain(d3.extent(data, function(d) { return d[yVar]; })).nice();

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
        .append("text")
        .attr("class", "label")
        .attr("x", width)
        .attr("y", -6)
        .style("text-anchor", "end")
        .text(xVar);

    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
        .append("text")
        .attr("class", "label")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text(yVar);

    /*
        These lines compute the minimum and maximum of the variables we'll show as radius and colour.
        I'll use these to normalise the values.
    */
    var xMax = d3.max(data, function(d) { return d[xVar]; });
    var xMin = d3.min(data, function(d) { return d[xVar]; });
    var yMax = d3.max(data, function(d) { return d[yVar]; });
    var yMin = d3.min(data, function(d) { return d[yVar]; });

    var rMax = d3.max(data, function(d) { return d[rVar]; });
    var rMin = d3.min(data, function(d) { return d[rVar]; });
    var cMax = d3.max(data, function(d) { return d[cVar]; });
    var cMin = d3.min(data, function(d) { return d[cVar]; });


    var cMaxs = [], cMins = [];
    for (i = 0; i<fileNames.length; i++){
        cMaxs[i] = maxOfDataSet (i, cVar);
    }
    for (i = 0; i<fileNames.length; i++){
        cMins[i] = minOfDataSet (i, cVar);
    }
    
    /*
        Here is where the points are constructed.
        Dots are plotted, where "cx" and "cy" are the coordinates, "r" is the radius and "fill" is the colour.
        The tooltip gets assigned new values and coordinates, according to which dot is hovered over.
        A new Chernoff face is constructed, based on which data point is hovered over.
        I've also used some normalising functions here, as chernoff.js usually accepts values between 0 - 1 or -1 - 1.
    */
    svg.selectAll(".dot")
        .data(data)
        .enter().append("circle")
        .filter(function(d) { return d[xVar] > x.domain()[0] && d[xVar] < x.domain()[1] 
            && d[yVar] > y.domain()[0] && d[yVar] < y.domain()[1]; })
        .attr("class", "dot")
        .attr("r", function(d) {return 3+normaliseValue(d[rVar],rMin,rMax)*4;})
        .attr("transform", transform)
        .style("fill", function(d) { return colorScales[d.setNr](normaliseValue(d[cVar],cMins[d.setNr],cMaxs[d.setNr])); })
        .on("click", function(d) {
            document.getElementById(fileNames[d.setNr]).click();
        })
        .on("mouseover", function(d) {
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html(xVar + ": " + d[xVar] + "<br/>" + yVar + ": " + d[yVar] + "<br/>"
                + cVar + ": " + d[cVar] + "<br/>" + rVar + ": " + d[rVar])
                .style("left", (d3.event.pageX + 10) + "px")
                .style("top", (d3.event.pageY - 28) + "px");

            chernoffSVG.selectAll("g.chernoff").data([{f: normaliseValue(d[xVar],xMin,xMax), 
                m: normaliseValue(d[yVar],yMin,yMax)*2-1,
                nw: normaliseValue(d[cVar],cMin,cMax),
                nh: normaliseValue(d[rVar],rMin,rMax),
                ew: 1, eh: 0.3, b: 0}]).enter()
                    .append("svg:g")
                    .attr("class", "chernoff")
                    .call(c);
        })
        .on("mouseout", function(d) {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
            chernoffSVG.text("");
        });

}