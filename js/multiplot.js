var fileName = "data/data.csv";

var data;

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
function start () {
    
    d3.csv(fileName, function(error, dataset) {
        if (error) throw error;
        
        var keys = d3.keys(dataset[0]);
        
        addSelect("xVar", keys, 1);
        addSelect("yVar", keys, 2);
        addSelect("zVar", keys, 3);
        addSelect("cVar", keys, 4);
        addSelect("rVar", keys, 5);
        
        data = dataset;
        
        drawPlots();
    });
}

/*
    Initializing steps for the scatterplot.
*/
var margin = {top: 20, right: 20, bottom: 30, left: 40},
    width = 300 - margin.left - margin.right,
    height = 300 - margin.top - margin.bottom;

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
    Clears all old plots and creates new ones by calling drawPlot with either 1, 2 or 3 for x, y or z, respectively.
*/
function drawPlots() {
    d3.select(".plot1").text("");
    d3.select(".plot2").text("");
    d3.select(".plot3").text("");
    d3.select(".plot4").text("");

    drawPlot("plot1", 1, 2);
    drawPlot("plot2", 3, 2);
    drawPlot("plot3", 1, 3);
    drawPlot("plot4", 3, 3);
}

/*
    Every time this function gets called (at pageload and when selecting a new variable), a new plot gets generated.
*/
function drawPlot(plotDiv, horizontalAxis, verticalAxis) {

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

    var cSelect = document.getElementById("cVar");
    var rSelect = document.getElementById("rVar");

    var horizontalVar = horizontalSelect.options[horizontalSelect.selectedIndex].value;
    var verticalVar = verticalSelect.options[verticalSelect.selectedIndex].value;
    var cVar = cSelect.options[cSelect.selectedIndex].value;
    var rVar = rSelect.options[rSelect.selectedIndex].value;
    
    data.forEach(function(d) {
        d[horizontalVar] = +d[horizontalVar];
        d[verticalVar] = +d[verticalVar];
        d[zVar] = +d[zVar];
        d[cVar] = +d[cVar];
        d[rVar] = +d[rVar];
    });
    
    /*
        Applies margins and width/height to plot svg.
    */
    var svg = d3.select("." + plotDiv).append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    /*
        Saves the tooltip div, because we'll need it later.
    */
    var tooltip = d3.select(".tooltip");

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
    var rMax = d3.max(data, function(d) { return d[rVar]; });
    var rMin = d3.min(data, function(d) { return d[rVar]; });
    var cMax = d3.max(data, function(d) { return d[cVar]; });
    var cMin = d3.min(data, function(d) { return d[cVar]; });
    
    /*
        Red-to-white color scale. For more info, check http://gka.github.io/chroma.js/.
    */
    chromaScale = chroma.scale("OrRd");

    /*
        Here is where the points are constructed.
        Dots are plotted, where "cx" and "cy" are the coordinates, "r" is the radius and "fill" is the colour.
        The tooltip gets assigned new values and coordinates, according to which dot is hovered over.
    */
    svg.selectAll(".dot")
        .data(data)
        .enter().append("circle")
        .attr("class", "dot")
        .attr("r", function(d) {return 3+normaliseValue(d[rVar],rMin,rMax)*4;})
        .attr("cx", function(d) { return x(d[horizontalVar]); })
        .attr("cy", function(d) { return y(d[verticalVar]); })
        .style("fill", function(d) { return chromaScale(normaliseValue(d[cVar],cMin,cMax)); })
        .on("mouseover", function(d) {
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html(horizontalVar + ": " + d[horizontalVar] + "<br/>" + verticalVar + ": " + d[verticalVar] + "<br/>"
                + cVar + ": " + d[cVar] + "<br/>" + rVar + ": " + d[rVar])
                .style("left", (d3.event.pageX + 10) + "px")
                .style("top", (d3.event.pageY - 28) + "px");
        })
        .on("mouseout", function(d) {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });

}