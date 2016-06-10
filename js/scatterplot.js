var fileName = "../data/data.csv";

var data;

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

function normaliseValue (value, min, max) {
	return ((value - min)/(max - min));
}

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

var margin = {top: 20, right: 20, bottom: 30, left: 40},
	width = 960 - margin.left - margin.right,
	height = 500 - margin.top - margin.bottom;

/*var xVar = "v2";
var yVar = "v3";
var cVar = "v4";
var rVar = "v5";*/

var x = d3.scale.linear()
	.range([0, width]);

var y = d3.scale.linear()
	.range([height, 0]);

//var color = d3.scale.category20();

var xAxis = d3.svg.axis()
	.scale(x)
	.orient("bottom");

var yAxis = d3.svg.axis()
	.scale(y)
	.orient("left");
	
function drawPlot() {

	d3.select(".plot").text("");

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
	
	var svg = d3.select(".plot").append("svg")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)
		.append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
	
	d3.selectAll(".tooltip").remove();
	
	// add the tooltip area to the webpage
	var tooltip = d3.select("body").append("div")
		.attr("class", "tooltip")
		.style("opacity", 0);

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

	var rMax = d3.max(data, function(d) { return d[rVar]; });
	var rMin = d3.min(data, function(d) { return d[rVar]; });
	var cMax = d3.max(data, function(d) { return d[cVar]; });
	var cMin = d3.min(data, function(d) { return d[cVar]; });
	
	chromaScale = chroma.scale("OrRd");

	svg.selectAll(".dot")
		.data(data)
		.enter().append("circle")
		.attr("class", "dot")
		.attr("r", function(d) {return 3+normaliseValue(d[rVar],rMin,rMax)*4;})
		.attr("cx", function(d) { return x(d[xVar]); })
		.attr("cy", function(d) { return y(d[yVar]); })
		//.style("fill", function(d) { return color(d[cVar]); });
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

		/*var legend = svg.selectAll(".legend")
			.data(color.domain())
			.enter().append("g")
			.attr("class", "legend")
			.attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

		legend.append("rect")
			.attr("x", width - 18)
			.attr("width", 18)
			.attr("height", 18)
			.style("fill", color);

		legend.append("text")
			.attr("x", width - 24)
			.attr("y", 9)
			.attr("dy", ".35em")
			.style("text-anchor", "end")
			.text(function(d) { return d; });*/

}