// set the dimensions and margins of the graph
const margin = {top: 10, right: 30, bottom: 30, left: 60},
      width = 500,
      height = 500;

// append the svg object to the body of the page
const svg = d3.select("#viz")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform",
    "translate(" + margin.left + "," + margin.top + ")");

// convert hr:min:sec to minutes
const parseTimeLeft = (timeLeft) => {
  return parseInt(timeLeft.split(":")[0]) + parseInt(timeLeft.split(":")[1])/60
};

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
  
  // Add X axis
  const x = d3.scaleLinear()
    .domain([0, d3.max(timeStreamed_hours)])
    .range([ 0, width ]);
  xAxis = svg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x));

  // Add Y axis
  const y = d3.scaleLinear()
    .domain([0, d3.max(timeLeft_hours)])
    .range([ height, 0 ]);
  yAxis = svg.append("g")
    .call(d3.axisLeft(y));
  
  // Add a clipPath: everything out of this area won't be drawn.
  const clip = svg.append("defs").append("svg:clipPath")
    .attr("id", "clip")
    .append("svg:rect")
    .attr("width", width)
    .attr("height", height)
    .attr("x", 0)
    .attr("y", 0);
  
  // Add brushing
  const brush = d3.brushX()                   
    .extent( [ [0,0], [width,height] ] )  
    .on("end", updateChart);
  
  // Create the line variable: where both the line and the brush take place
  const line = svg.append('g')
    .attr("clip-path", "url(#clip)");

  // Add the line
  line.append("path")
    .datum(data_zip)
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 1.5)
    .attr("d", d3.line()
      .x(d => x(d.timeStreamed))
      .y(d => y(d.timeLeft))
    );
  
  // Add the brushing
  line.append("g")
    .attr("class", "brush")
    .call(brush);
  
  // set idleTimeOut to null
  var idleTimeout;
  const idled = () => { idleTimeout = null };

  // A function that update the chart for given boundaries
  function updateChart() {

    // What are the selected boundaries?
    extent = d3.event.selection

    // If no selection, back to initial coordinate. Otherwise, update X axis domain
    if(!extent){
      if (!idleTimeout) return idleTimeout = setTimeout(idled, 350);
    }else{
      x.domain([ x.invert(extent[0]), x.invert(extent[1]) ])
      line.select(".brush").call(brush.move, null) 
    }

    // Update axis and line position
    xAxis.transition().duration(1000).call(d3.axisBottom(x))
    line.select('.line')
      .transition()
      .duration(1000)
      .attr("d", d3.line()
        .x(d => x(d.timeStreamed))
        .y(d => y(d.timeLeft))
      )
  };

  // If user double click, reinitialize the chart
  svg.on("dblclick", () => {
    x.domain([0, d3.max(timeStreamed_hours)])
    xAxis.transition().call(d3.axisBottom(x))
    line
      .select('.line')
      .transition()
      .attr("d", d3.line()
        .x(d => x(d.timeStreamed))
        .y(d => y(d.timeLeft))
    )
  });

});