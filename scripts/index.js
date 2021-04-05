// set the dimensions and margins of the graph
var margin = { top: 10, right: 30, bottom: 30, left: 60 },
    width = 700 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

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

  // reformat xy data
  const timeStreamed_hours = Array.from(Array(data.timeLeft.length), (_,x) => x*0.5);
  const timeLeft_hours = data.timeLeft.map(d => parseTimeLeft(d));
  const data_zip = timeStreamed_hours.map((timeStreamed, index) => {
    return {timeStreamed:timeStreamed, timeLeft:timeLeft_hours[index] }
  })

  // Define xy axes
  var xDomain = [0, d3.max(timeStreamed_hours)],
      yDomain = [0, d3.max(timeLeft_hours)];
  var xScale = d3.scaleLinear().domain(xDomain).range([ 0, width ]),
      yScale = d3.scaleLinear().domain(yDomain).range([ height, 0 ]);
  var xAxis = d3.axisBottom(xScale),
      yAxis = d3.axisLeft(yScale);

  // Define brush
  var brush = d3.brush().on("end", brushended),
      idleTimeout,
      idleDelay = 350;

  // Define line
  var drawLine = d3.line()
    .defined(d => !isNaN(d.timeLeft))
    .x(d => xScale(d.timeStreamed))
    .y(d => yScale(d.timeLeft))

  // Add a clipPath: everything out of this area won't be drawn.
  var clip = svg.append("defs").append("svg:clipPath")
    .attr("id", "clip")
    .append("svg:rect")
    .attr("width", width)
    .attr("height", height)
    .attr("x", 0)
    .attr("y", 0);

  // Create the line svg: where both the line and the brush take place
  var svg_line = svg.append('g')
    .attr("clip-path", "url(#clip)");

  // Add x-axis
  svg.append("g")
    .attr("class", "axis axis--x")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);

  // Add y-axis
  svg.append("g")
    .attr("class", "axis axis--y")
    .call(yAxis)

  // Add x-axis label
  svg.append("text")             
    .attr("transform",
          "translate(" + (width/2) + " ," + 
                         (height + margin.top + 20) + ")")
    .style("text-anchor", "middle")
    .text("# hours streamed");

  // Add y-axis label
  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - margin.left)
    .attr("x",0 - (height / 2))
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .text("# hours left");  

  // Add brush
  svg_line.append("g")
    .attr("class", "brush")
    .call(brush);

  // Add line
  svg_line.append("path")
    .datum(data_zip)
    .attr("class", "line")
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 1.5)
    .attr("d", drawLine);

  function brushended() {
    var brushBounds = d3.event.selection;
    if (!brushBounds) {
      if (!idleTimeout) return idleTimeout = setTimeout(idled, idleDelay);
      xScale.domain(xDomain);
      yScale.domain(yDomain);
    } else {
      xScale.domain([brushBounds[0][0], brushBounds[1][0]].map(xScale.invert, xScale));
      yScale.domain([brushBounds[1][1], brushBounds[0][1]].map(yScale.invert, yScale));
      svg_line.select(".brush").call(brush.move, null);
    }
    zoom();
  }

  function idled() {
    idleTimeout = null;
  }

  function zoom() {
    var t = svg.transition().duration(750);
    svg.select(".axis--x").transition(t).call(xAxis);
    svg.select(".axis--y").transition(t).call(yAxis);
    svg_line.selectAll(".line").transition(t).attr("d", drawLine);
  }

});
