var fileName = "../data/data.csv";

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
		addSelect("cVar", keys, 3);
		addSelect("rVar", keys, 4);
		
		data = dataset;
		
		drawPlot();
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

var xAxis = d3.svg.axis()
	.scale(x)
	.orient("bottom");

var yAxis = d3.svg.axis()
	.scale(y)
	.orient("left");

/*
	Every time this function gets called (at pageload and when selecting a new variable), a new plot gets generated.
*/
function drawPlot() {

	d3.select(".plot").text("");

	/*
		Looks at the dropdown menus and saves their values, so that these values can be looked up in the dataset.
	*/
	var xSelect = document.getElementById("xVar");
	var ySelect = document.getElementById("yVar");
	var cSelect = document.getElementById("cVar");
	var rSelect = document.getElementById("rVar");

	var xVar = xSelect.options[xSelect.selectedIndex].value;
	var yVar = ySelect.options[ySelect.selectedIndex].value;
	var cVar = cSelect.options[cSelect.selectedIndex].value;
	var rVar = rSelect.options[rSelect.selectedIndex].value;
	
	data.forEach(function(d) {
		d[xVar] = +d[xVar];
		d[yVar] = +d[yVar];
		d[cVar] = +d[cVar];
		d[rVar] = +d[rVar];
	});
	
	/*
		Applies margins and width/height to plot svg.
	*/
	var svg = d3.select(".plot").append("svg")
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
		.attr("cx", function(d) { return x(d[xVar]); })
		.attr("cy", function(d) { return y(d[yVar]); })
		.style("fill", function(d) { return chromaScale(normaliseValue(d[cVar],cMin,cMax)); })
		.on("mouseover", function(d) {
			tooltip.transition()
				.duration(200)
				.style("opacity", .9);
			tooltip.html(xVar + ": " + d[xVar] + "<br/>" + yVar + ": " + d[yVar] + "<br/>"
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