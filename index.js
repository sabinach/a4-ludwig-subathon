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
	
	if (error) throw error;

	// reformat x-y data
	const timeStreamed_hours = Array.from(Array(data.timeLeft.length), (_,x) => x*0.5);
	const timeLeft_hours = data.timeLeft.map(d => parseTimeLeft(d));
	const data_zip = timeStreamed_hours.map((timeStreamed, index) => {
		return {timeStreamed:timeStreamed, timeLeft:timeLeft_hours[index] }
	})
	
	// Add X axis
	const x = d3.scaleLinear()
	  .domain([0, d3.max(timeStreamed_hours)])
	  .range([ 0, width ]);
	svg.append("g")
	  .attr("transform", "translate(0," + height + ")")
	  .call(d3.axisBottom(x));

	// Add Y axis
	const y = d3.scaleLinear()
	  .domain([0, d3.max(timeLeft_hours)])
	  .range([ height, 0 ]);
	svg.append("g")
	  .call(d3.axisLeft(y));

	// Add the line
    svg.append("path")
      .datum(data_zip)
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-width", 1.5)
	  .attr("d", d3.line()
        .x(d => x(d.timeStreamed))
        .y(d => y(d.timeLeft))
       	)
	
	// debug
	console.log(data_zip);

});