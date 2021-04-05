// set the dimensions and margins of the graph
var margin = { top: 10, right: 30, bottom: 30, left: 60 },
    width = 1000 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

// append the svg object to the body of the page
var svg = d3.select("#viz")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform",
    "translate(" + margin.left + "," + margin.top + ")");


// string to d3 datetime conversion function
var parseDatetime = d3.timeParse("%Y-%m-%d %H:%M");

// The data recorded began at 2pm PST on March 15th, the time Ludwig intended to start the subathon.
var subathonStartDate = parseDatetime("2021-03-15 17:00"); // converted to EST

// calculate hours from subathon start 
var datetimeToHours = (datetime) => d3.timeMinute.count(subathonStartDate, datetime)/60

// convert hr:min:sec to minutes
var parseTimeLeft = timeLeft => parseInt(timeLeft.split(":")[0]) + parseInt(timeLeft.split(":")[1])/60;

console.log("subathonStartDate: ", subathonStartDate) // debug


// create viz with imported data
function createViz(error, ...args) {
  
  // handle error
  if (error) throw error;

  // save json objects
  const timeLeftJson = args[0];
  const viewersJson = args[1];
  const followersJson = args[2];
  const highlightsJson = args[3];

  /* --------------------------------------------- */
  // TIME LEFT

  // reformat xy data (timeLeftJson)
  const timeStreamed_hours = Array.from(Array(timeLeftJson.timeLeft.length), (_,x) => x*0.5);
  const timeLeft_hours = timeLeftJson.timeLeft.map(d => parseTimeLeft(d));
  const timeLeftJson_zip = timeStreamed_hours.map((timeStreamed, index) => {
    return {timeStreamed:timeStreamed, timeLeft:timeLeft_hours[index] }
  });

  console.log("timeLeftJson_zip: ", timeLeftJson_zip)

  /* --------------------------------------------- */
  // VIEWERS

  const datetime_viewers = viewersJson.data.labels;
  const gamePlayed_viewers = viewersJson.data.datasets;

  console.log("datetime_viewers: ", datetime_viewers)
  console.log("gamePlayed_viewers: ", gamePlayed_viewers)

  // handle error: mismatch xy length
  gamePlayed_viewers.forEach(gamePlayed => {
    if(datetime_viewers.length!==gamePlayed.data.length) throw error;
  })

  /* --------------------------------------------- */
  // FOLLOWERS

  const datetime_followers = followersJson.data.labels;
  const num_followers = followersJson.data.datasets[2].data; // hardcoded index for "Followers trend"

  console.log("datetime_followers: ", datetime_followers)
  console.log("num_followers: ", num_followers)

  // handle error: mismatch xy length
  if (datetime_followers.length !== num_followers.length) throw error;

  /* --------------------------------------------- */
  // HIGHLIGHTS

  const datetime_highlights = highlightsJson.datetime;
  const title_highlights = highlightsJson.title; 
  const desc_highlights = highlightsJson.desc;
  const url_highlights = highlightsJson.url;

  //console.log("datetime_highlights: ", datetime_highlights)
  //console.log("title_highlights: ", title_highlights)
  //console.log("desc_highlights: ", desc_highlights)
  //console.log("url_highlights: ", url_highlights)

  // handle error: mismatch xy length
  if (datetime_highlights.length !== title_highlights.length || 
        datetime_highlights.length !== desc_highlights.length || 
        datetime_highlights.length !== url_highlights.length ) 
    throw error;

  const highlights_zip = datetime_highlights
    .map((datetime, index) => {
      return {
        id: index, 
        timeStreamed: null,
        datetime: parseDatetime(datetime), 
        title: title_highlights[index],
        desc: desc_highlights[index],
        url: url_highlights[index]
      }
    })
    .filter(highlight => highlight.datetime > subathonStartDate)
    .map(highlight => { 
      const xHour = datetimeToHours(highlight.datetime)
      const yHour = timeLeft_hours[timeStreamed_hours.indexOf(xHour)]
      return {
        id: highlight.id,
        timeStreamed: xHour,
        timeLeft: yHour,
        datetime: highlight.datetime,
        title: highlight.title,
        desc: highlight.desc,
        url: highlight.url
      }
    });

  console.log("highlights_zip: ", highlights_zip)

  /* --------------------------------------------- */
  // GRAPH

  /* --- Simple Line DEFINITIONS --- */

  // Define xy axes
  var xDomain = [0, d3.max(timeStreamed_hours)],
      yDomain = [0, d3.max(timeLeft_hours)];
  var xScale = d3.scaleLinear().domain(xDomain).range([ 0, width ]),
      yScale = d3.scaleLinear().domain(yDomain).range([ height, 0 ]);
  var xAxis = d3.axisBottom(xScale),
      yAxis = d3.axisLeft(yScale);

  // Define line (timeLeft)
  var timeLeftLine = d3.line()
    .defined(d => !isNaN(d.timeLeft))
    .x(d => xScale(d.timeStreamed))
    .y(d => yScale(d.timeLeft))

  // Define line (highlights)
  var highlightsLine = d3.line()
    .defined(d => !isNaN(d.value))
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
    .call(yAxis)

  // Add x-axis label
  svg.append("text")             
    .attr("transform",
          "translate(" + (width/2) + " ," + (height + margin.top + 20) + ")")
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

  /* --- Brush + Line Clip DEFINITIONS --- */

  // Define brush
  var brush = d3.brush().on("end", brushended),
      idleTimeout,
      idleDelay = 350;

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

  // Add line (timeLeft)
  svg_line.append("path")
    .datum(timeLeftJson_zip)
    .attr("class", "line")
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 1.5)
    .attr("d", timeLeftLine);

  // Add brush
  svg_line.append("g")
    .attr("class", "brush")
    .call(brush);

  /* --- Highlights Node DEFINITION --- */

  // Add nodes (event highlights)
  svg_line.selectAll("circle")
    .data(highlights_zip)
    .enter().append("circle")
    .attr("cx", d => xScale(d.timeStreamed))
    .attr("cy", d =>  yScale(d.timeLeft))
    .attr("r", (d, i) => 5)
    .attr("id", d => d.id)
    .style("fill", "#fcb0b5")
    .on("mouseover", highlightsNode_mouseover)
    .on("mouseout", highlightsNode_mouseout);

  /* --- Brush + Line Clip FUNCTIONS --- */

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
    svg_line.selectAll(".line").transition(t).attr("d", timeLeftLine);
    svg_line.selectAll("circle").transition(t)
      .attr("cx", d => xScale(d.timeStreamed))
      .attr("cy", d => yScale(d.timeLeft));
  }

  /* --- Highlights Node FUNCTIONS --- */

  function highlightsNode_mouseover(d, i){
    d3.select(this).transition().duration(100).style("fill", "#d30715");

    svg_line.selectAll("#tooltip").data([d]).enter().append("text")
      .attr("id", "tooltip")
      .text((d, i) => d.timeLeft)
      .attr("y", d => yScale(d.timeLeft)-12)
      .attr("x", d => xScale(d.timeStreamed))

    /*
    svg_line.selectAll("#tooltip_path").data([d]).enter().append("line")
      .attr("id", "tooltip_path")
      .attr("class", "line")
      .attr("d", highlightsLine)
      .attr("x1", d => xScale(d.timeStreamed))
      .attr("x2", d => xScale(d.timeStreamed))
      .attr("y1", height)
      .attr("y2", d => yScale(d.timeLeft))
      .attr("stroke", "black")
      .style("stroke-dasharray", ("3, 3"));
    */
  }

  function highlightsNode_mouseout(d, i){
    d3.select(this).transition().duration(100).style("fill", "#fcb0b5");
    svg_line.selectAll("#tooltip").remove();
    svg_line.selectAll("#tooltip_path").remove();
  }

};

// read json files
d3.queue()
  .defer(d3.json, "data/timeLeft.json")
  .defer(d3.json, "data/viewers.json")
  .defer(d3.json, "data/followers.json")
  .defer(d3.json, "data/highlights.json")
  .await(createViz)
