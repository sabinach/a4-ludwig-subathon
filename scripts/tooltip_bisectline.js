var focus = svg.append("g")
  .attr("class", "focus")
  .style("display", "none");

focus.append("line")
  .attr("class", "x-hover-line hover-line")
  .attr("y1", 0)
  .attr("y2", height_timeLeft);

focus.append("line")
  .attr("class", "y-hover-line hover-line")
  .attr("x1", width)
  .attr("x2", width);

focus.append("circle")
  .attr("r", 6);

focus.append("text")
  .attr("x", 15)
  .attr("dy", ".31em");

svg_line_timeLeft.append("rect")
  .attr("class", "overlay")
  .attr("width", width)
  .attr("height", height_timeLeft)
  .on("mouseover", function() { focus.style("display", null); })
  .on("mouseout", function() { focus.style("display", "none"); })
  .on("mousemove", mousemove_timeLeft);

var bisectHour = d3.bisector(function(d) { return d.timeStreamed; }).left;

function mousemove_timeLeft() {
  var x0 = xScale_timeLeft.invert(d3.mouse(this)[0]),
      i = bisectHour(timeLeftJson_zip, x0, 1),
      d0 = timeLeftJson_zip[i - 1],
      d1 = timeLeftJson_zip[i],
      d = x0 - d0.timeStreamed > d1.timeStreamed - x0 ? d1 : d0;

  focus.attr("transform", "translate(" + xScale_timeLeft(d.timeStreamed) + "," + yScale_timeLeft(d.timeLeft) + ")");
  focus.select("text").text(function() { return d.timeLeft; });
  focus.select(".x-hover-line").attr("y2", height_timeLeft - yScale_timeLeft(d.timeLeft));
  focus.select(".y-hover-line").attr("x2", width + width);
}