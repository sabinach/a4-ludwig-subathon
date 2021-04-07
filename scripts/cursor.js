// This allows to find the closest X index of the mouse:
var bisect = d3.bisector(function(d) { return d.timeStreamed; }).left;

// Create the circle that travels along the curve of chart
var focus = svg.append('g')
  .append('circle')
  .style("fill", "none")
  .attr("stroke", "black")
  .attr('r', 3)
  .style("opacity", 0)

// Create the text that travels along the curve of chart
var focusText = svg.append('g')
  .append('text')
  .style("opacity", 0)
  .attr("text-anchor", "left")
  .attr("alignment-baseline", "middle")

// Create a rect on top of the svg area: this rectangle recovers mouse position
svg.append('rect')
  .style("fill", "none")
  .style("pointer-events", "all")
  .attr('width', width)
  .attr('height', height)
  .on('mouseover', mouseover)
  .on('mousemove', mousemove)
  .on('mouseout', mouseout);

// What happens when the mouse move -> show the annotations at the right positions.
function mouseover() {
  focus.style("opacity", 1)
  focusText.style("opacity",1)
}

function mousemove() {
  // recover coordinate we need
  var xMouse = xScale.invert(d3.mouse(this)[0]);
  var i = bisect(data_zip, xMouse, 1);
  selectedData = data_zip[i]
  focus
    .attr("cx", xScale(selectedData.timeStreamed))
    .attr("cy", yScale(selectedData.timeLeft))
  focusText
    .html(selectedData.timeLeft.toFixed(2) + " hours")
    .attr("x", xScale(selectedData.timeStreamed)+15)
    .attr("y", yScale(selectedData.timeLeft))
}

function mouseout() {
  focus.style("opacity", 0)
  focusText.style("opacity", 0)
}