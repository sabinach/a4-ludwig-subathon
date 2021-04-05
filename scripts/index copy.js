// set the dimensions and margins of the graph
var margin = {top: 10, right: 30, bottom: 30, left: 60},
    width = 500,
    height = 500;

// append the svg object to the body of the page
var svg = d3.select("#viz")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform",
    "translate(" + margin.left + "," + margin.top + ")");

// convert hr:min:sec to minutes
var parseTimeLeft = timeLeft => parseInt(timeLeft.split(":")[0]) + parseInt(timeLeft.split(":")[1])/60;

// read json
d3.json("data/timeLeft.json", (error, data) => {
  
  // handle error
  if (error) throw error;

  // reformat x/y data
  const timeStreamed_hours = Array.from(Array(data.timeLeft.length), (_,x) => x*0.5);
  const timeLeft_hours = data.timeLeft.map(d => parseTimeLeft(d));
  const data_zip = timeStreamed_hours.map((timeStreamed, index) => {
    return {timeStreamed:timeStreamed, timeLeft:timeLeft_hours[index] }
  })

  // Define x/y axes
  var x0 = [0, d3.max(timeStreamed_hours)],
      y0 = [0, d3.max(timeLeft_hours)];
  var xScale = d3.scaleLinear().domain(x0).range([ 0, width ]),
      yScale = d3.scaleLinear().domain(y0).range([ height, 0 ]);
  var xAxis = d3.axisBottom(xScale),
      yAxis = d3.axisLeft(yScale);

  // Define brush
  var brush = d3.brush().on("end", brushended),
      idleTimeout,
      idleDelay = 350;

  // Define line
  var line = d3.line()
    .defined(d => !isNaN(d.timeLeft))
    .x(d => xScale(d.timeStreamed))
    .y(d => yScale(d.timeLeft))

  // Add x-axis
  svg.append("g")
    .attr("class", "axis axis--x")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);

  // Add y-axis
  svg.append("g")
    .attr("class", "axis axis--y")
    .call(yAxis);

  svg.selectAll(".domain")
    .style("display", "none");

  // Add brush
  svg.append("g")
    .attr("class", "brush")
    .call(brush);

  // Add line
  svg.append("path")
    .datum(data_zip)
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 1.5)
    .attr("d", line);

  function brushended() {
    var extent = d3.event.selection;
    if (!extent) {
      if (!idleTimeout) return idleTimeout = setTimeout(idled, idleDelay);
      xScale.domain(x0);
      yScale.domain(y0);
    } else {
      xScale.domain([extent[0][0], extent[1][0]].map(xScale.invert, xScale));
      yScale.domain([extent[1][1], extent[0][1]].map(yScale.invert, yScale));
      svg.select(".brush").call(brush.move, null);
    }
    zoom();
  }

  function idled() {
    idleTimeout = null;
  }

  function zoom() {
    var time = svg.transition().duration(750);
    svg.select(".axis--x").transition(time).call(xAxis);
    svg.select(".axis--y").transition(time).call(yAxis);
    svg.selectAll(".path").transition(time).attr("d", line);
  }

});
