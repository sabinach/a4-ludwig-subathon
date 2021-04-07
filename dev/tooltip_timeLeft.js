var tooltip_timeLeft = d3.select('#line-viz')
    .append('div')
    .attr('id', 'tooltip_timeLeft');

  svg_line_timeLeft.selectAll(".dot-timeLeft")
   .data(timeLeftJson_zip)
   .enter().append("circle")
   .attr("class", "dot-timeLeft")
   .attr("r", 2)
   .attr("cx", d => xScale_timeLeft(d.timeStreamed))
   .attr("cy", d => yScale_timeLeft(d.timeLeft))
   .attr("opacity", 0)
   .style("fill", "#4292c6")
   .on('mouseover', d => {
     tooltip_timeLeft.transition()
       .duration(100)
       .style('opacity', .9);
     tooltip_timeLeft.text(d.timeLeft.toFixed(1))
       .style('left', `${d3.event.pageX + 2}px`)
       .style('top', `${d3.event.pageY - 18}px`);
   })
   .on('mouseout', () => {
     tooltip_timeLeft.transition()
       .duration(300)
       .style('opacity', 0);
   });

/* CSS

#tooltip_timeLeft {
  height: 18px;
  opacity: 0;
  pointer-events: none;
  position: absolute;
  text-align: center;
}

*/