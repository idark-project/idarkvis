var fileNames = ["data/data.csv"];

/*
    I use these values to keep track of how many face variables there are, if a face has already been drawn
    and which variable was drawn last.
*/
var faceValues = 7;
var chernoffIsSet = false;
var isMultiplot = false;
var useChernoff = true;
var currentFace;
var margin;
var x, y;
var xAxis, yAxis;

/*
    Initialisation methods for checkboxes.
*/

function mockDataBox () {
    data = [];
    if(d3.select("#mockDataBox").property("checked")){
        fileNames = ["data/data.csv", "data/MOCK_DATA.csv"];
    } else {
        fileNames = ["data/data.csv"];
    }
    loadDataSets(0);
}

function chernoffBox () {
    data = [];
    if(d3.select("#chernoffBox").property("checked")){
        d3.select(".chernoffTable")
                .transition()
                .duration(500)
                .style("opacity", 1);
        useChernoff = true;
    } else {
        d3.select(".chernoffTable")
                .transition()
                .duration(500)
                .style("opacity", 0);
        useChernoff = false;
    }
}

function multiplotBox () {
    if(d3.select("#multiplotBox").property("checked")){
        isMultiplot = true;
        d3.select("#hiddenVar").style("display", "initial");
    } else {
        isMultiplot = false;
        d3.select("#hiddenVar").style("display", "none");
    }
    onPageLoad ();
}

/*
    For more info on the color scales used in this code, check http://gka.github.io/chroma.js/.
*/
var colorScales = [chroma.scale("OrRd"), chroma.scale(['yellow', '008ae5'])];

var data = [];
var datasets = [];

//var xVar;
//var yVar;

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

function resetZoom () {
    drawPlots();
}

/*
    Normalises a value, such that a value in a list [min, max] becomes a value in a list [0,1]
*/
function normaliseValue (value, min, max) {
    return ((value - min)/(max - min));
}

/*
    Function gets called on pageload.
    Initialises the checkboxes.
    Then initialises the dropdown menus with addSelect and saves the dataset as the variable data.
    Then calls drawPlot to draw the first plot.
*/
function onPageLoad () {

    d3.select("#mockDataBox").on("change",mockDataBox);
    d3.select("#chernoffBox").on("change",chernoffBox);
    d3.select("#multiplotBox").on("change",multiplotBox);
    
    d3.csv(fileNames[0], function(error, dataset) {
        if (error) throw error;
        
        var keys = d3.keys(dataset[0]);
        a = 0;
        
        addSelect("xVar", keys, 1);
        addSelect("yVar", keys, 2);

        if (isMultiplot){
            addSelect("zVar", keys, 3);
            a=1;
        }

        addSelect("cVar", keys, 3+a);
        addSelect("rVar", keys, 4+a);

        for (var i=0; i<faceValues; i++){
            addSelect("faceVar" + i, keys, 5+i+a);
        }
        
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
        drawPlots();
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


function drawPlots () {
    d3.select(".downloads").selectAll("a").remove();

    for (i = 0; i<fileNames.length; i++){
        d3.select(".downloads").append("a")
            .attr("href", fileNames[i])
            .attr("id", fileNames[i])
            .attr("hidden", true);
    }

    d3.select(".plot1").select("svg").remove();
    d3.select(".plot2").select("svg").remove();
    d3.select(".plot3").select("svg").remove();
    d3.select(".plot4").select("svg").remove();

    if (isMultiplot){
        margin = {top: 20, right: 20, bottom: 30, left: 40},
            width = 300 - margin.left - margin.right,
            height = 300 - margin.top - margin.bottom;
    } else {
        margin = {top: 20, right: 20, bottom: 20, left: 20},
            width = 700 - margin.left - margin.right,
            height = 500 - margin.top - margin.bottom;
    }

    drawPlot("plot1", 1, 2);
    if (isMultiplot){
        drawPlot("plot2", 3, 2);
        drawPlot("plot3", 1, 3);
        drawPlot("plot4", 3, 3);
    }
}

/*
    Every time this function gets called (at pageload and when selecting a new variable), a new plot gets generated.
*/
function drawPlot (plotDiv, horizontalAxis, verticalAxis) {

    /*
        Looks at the dropdown menus and saves their values, so that these values can be looked up in the dataset.
        First, via a switch-statement, the correct variables are assigned using the horizontalAxis, verticalAxis parameters.
    */
    switch (horizontalAxis){
        case 1: var horizontalSelect = document.getElementById("xVar"); break;
        case 2: var horizontalSelect = document.getElementById("yVar"); break;
        case 3: var horizontalSelect = document.getElementById("zVar"); break;
        default: break;
    }

    switch (verticalAxis){
        case 1: var verticalSelect = document.getElementById("xVar"); break;
        case 2: var verticalSelect = document.getElementById("yVar"); break;
        case 3: var verticalSelect = document.getElementById("zVar"); break;
        default: break;
    }

    x = d3.scale.linear()
        .range([0, width]);

    y = d3.scale.linear()
        .range([height, 0]);

    /*
        Because of defining the tickFormat as "g", big/small numbers get converted to scientific notation.
        For more information: https://github.com/d3/d3/wiki/Formatting
    */
    xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom")
        .tickFormat(d3.format("g"));

    yAxis = d3.svg.axis()
        .scale(y)
        .orient("left")
        .tickFormat(d3.format("g"));

    /*
        Looks at the dropdown menus and saves their values, so that these values can be looked up in the dataset.
    */
    var cSelect = document.getElementById("cVar");
    var rSelect = document.getElementById("rVar");
    var faceSelect = [];

    for (var i=0;i<faceValues;i++){
        faceSelect[i] = document.getElementById("faceVar" + i);
    }

    var horizontalVar = horizontalSelect.options[horizontalSelect.selectedIndex].value;
    var verticalVar = verticalSelect.options[verticalSelect.selectedIndex].value;
    var cVar = cSelect.options[cSelect.selectedIndex].value;
    var rVar = rSelect.options[rSelect.selectedIndex].value;
    var faceVar = [];

    for (var i=0;i<faceValues;i++){
        faceVar[i] = faceSelect[i].options[faceSelect[i].selectedIndex].value;
    }
    
    data.forEach(function(d) {
        d[horizontalVar] = +d[horizontalVar];
        d[verticalVar] = +d[verticalVar];
        d[cVar] = +d[cVar];
        d[rVar] = +d[rVar];
        for (i=0;i<faceValues;i++){
            d[faceVar[i]] = +d[faceVar[i]];
        }
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
    var svg = d3.select("." + plotDiv).append("svg")
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
            .filter(function(d) { return !(d[horizontalVar] >= x.domain()[0] && d[horizontalVar] <= x.domain()[1] 
                && d[verticalVar] >= y.domain()[0] && d[verticalVar] <= y.domain()[1]); })
            .remove();
        svg.selectAll(".dot")
            .attr("transform", transform);
    }

    function transform(d) {
        return "translate(" + x(d[horizontalVar]) + "," + y(d[verticalVar]) + ")";
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
    x.domain(d3.extent(data, function(d) { return d[horizontalVar]; })).nice();
    y.domain(d3.extent(data, function(d) { return d[verticalVar]; })).nice();

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
        .append("text")
        .attr("class", "label")
        .attr("x", width)
        .attr("y", -6)
        .style("text-anchor", "end")
        .text(horizontalVar);

    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
        .append("text")
        .attr("class", "label")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text(verticalVar);

    /*
        These lines compute the minimum and maximum of the variables we'll show as radius and colour.
        I'll use these to normalise the values.
    */
    var horizontalMax = d3.max(data, function(d) { return d[horizontalVar]; });
    var horizontalMin = d3.min(data, function(d) { return d[horizontalVar]; });
    var verticalMax = d3.max(data, function(d) { return d[verticalVar]; });
    var verticalMin = d3.min(data, function(d) { return d[verticalVar]; });

    var rMax = d3.max(data, function(d) { return d[rVar]; });
    var rMin = d3.min(data, function(d) { return d[rVar]; });
    var cMax = d3.max(data, function(d) { return d[cVar]; });
    var cMin = d3.min(data, function(d) { return d[cVar]; });

    var faceMax = [];
    var faceMin = [];

    for (var i=0;i<faceValues;i++){
        faceMax[i] = d3.max(data, function(d) { return d[faceVar[i]]; });
        faceMin[i] = d3.min(data, function(d) { return d[faceVar[i]]; });
    }

    var cMaxs = [], cMins = [];
    for (i = 0; i<fileNames.length; i++){
        cMaxs[i] = maxOfDataSet (i, cVar);
    }
    for (i = 0; i<fileNames.length; i++){
        cMins[i] = minOfDataSet (i, cVar);
    }

    /*
        This makes the tool redraw the Chernoff face when variables are changed.
    */
    if (chernoffIsSet){
        setChernoff(currentFace, chernoffSVG);
    }

    /*
        Draws a new Chernoff face, using the face variables defined.
    */
    function setChernoff (d, chernoffSVG){
        chernoffSVG.text("");
        chernoffSVG.selectAll("g.chernoff").data([{f: normaliseValue(d[faceVar[0]],faceMin[0],faceMax[0]), 
            m: normaliseValue(d[faceVar[1]],faceMin[1],faceMax[1])*2-1,
            nw: normaliseValue(d[faceVar[2]],faceMin[2],faceMax[2])*2-1,
            nh: normaliseValue(d[faceVar[3]],faceMin[3],faceMax[3]),
            ew: normaliseValue(d[faceVar[4]],faceMin[4],faceMax[4]),
            eh: normaliseValue(d[faceVar[5]],faceMin[5],faceMax[5]),
            b: normaliseValue(d[faceVar[6]],faceMin[6],faceMax[6])*2-1}]).enter()
                .append("svg:g")
                .attr("class", "chernoff")
                .call(c);
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
            tooltip.html(horizontalVar + ": " + d[horizontalVar] + "<br/>" + verticalVar + ": " + d[verticalVar] + "<br/>"
                + cVar + ": " + d[cVar] + "<br/>" + rVar + ": " + d[rVar])
                .style("left", (d3.event.pageX + 10) + "px")
                .style("top", (d3.event.pageY - 28) + "px");

            if (useChernoff){
                setChernoff(d, chernoffSVG);
                currentFace = d;
                chernoffIsSet = true;
            }
        })
        .on("mouseout", function(d) {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });

}