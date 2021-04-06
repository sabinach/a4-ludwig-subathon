// video embed settings
var parentDomain = "127.0.0.1" // deploy: 6859-sp21.github.io
                               // test: 127.0.0.1

// set canvas dimensions
var svg_width = 650;
var svg_height = 750;

// set the dimensions and margins
var margin_timeLeft = { top: 10, right: 50, bottom: 450, left: 60 };
var height_timeLeft = svg_height - margin_timeLeft.top - margin_timeLeft.bottom;

var margin_viewers = { top: 360, right: 50, bottom: 250, left: 60 };
var height_viewers = svg_height - margin_viewers.top - margin_viewers.bottom;

var margin_subFollows = { top: 563, right: 50, bottom: 50, left: 60 };
var height_subFollows = svg_height - margin_subFollows.top - margin_subFollows.bottom;

var margin_text = 20; //global
var width = svg_width - margin_timeLeft.left - margin_timeLeft.right; // global
  
// append the svg object to the body of the page
var svg = d3.select("#line-viz")
  .append("svg")
  .attr("width", width + margin_timeLeft.left + margin_timeLeft.right)
  .attr("height", height_timeLeft + margin_timeLeft.top + margin_timeLeft.bottom)
  .append("g")
  .attr("transform",
    "translate(" + margin_timeLeft.left + "," + margin_timeLeft.top + ")");

// string to d3 datetime conversion function
var parseDatetime = d3.timeParse("%Y-%m-%d %H:%M");

// The data recorded began at 2pm PST on March 15th, the time Ludwig intended to start the subathon.
var subathonStartDate = parseDatetime("2021-03-15 17:00"); // converted to EST
var subathonEndDate = new Date;

// calculate hours from subathon start 
var datetimeToHours = d3Datetime => d3.timeMinute.count(subathonStartDate, d3Datetime)/60

// convert hr:min:sec to hours
var parseTimeLeft = timeLeft => parseInt(timeLeft.split(":")[0]) + parseInt(timeLeft.split(":")[1])/60;

// convert d3 datetime to human-friendly version
var formatDatetime = d3.timeFormat("%B %d, %Y %H:%M")

var formatTime = d3.timeFormat("%B %d, %Y");
console.log(formatTime(new Date)); // "June 30, 2015"

console.log("subathonStartDate: ", subathonStartDate) 
console.log("subathonEndDate: ", subathonEndDate) // TODO -- update!


/* ------------------------------------------------------------------- */
/* ------------------------------------------------------------------- */


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
  // TIME LEFT / SUBS GAINED

  // reformat xy data (timeLeftJson)
  const timeStreamed_hours = Array.from(Array(timeLeftJson.timeLeft.length), (_,x) => x*0.5);
  const timeLeft_hours = timeLeftJson.timeLeft.map(d => parseTimeLeft(d));

  const timeLeftJson_zip = timeStreamed_hours.map((timeStreamed, index) => {
    return {
      timeStreamed: timeStreamed, 
      timeLeft: timeLeft_hours[index],
      subsGained: timeLeftJson.subsGained[index]
    }
  });

  console.log("timeLeftJson_zip: ", timeLeftJson_zip)

  /* --------------------------------------------- */
  // VIEWERS

  const datetime_viewers = viewersJson.data.labels;
  const gamePlayed_viewers = viewersJson.data.datasets;

  //console.log("datetime_viewers: ", datetime_viewers)
  //console.log("gamePlayed_viewers: ", gamePlayed_viewers)

  // handle error: mismatch xy length
  gamePlayed_viewers.forEach(gamePlayed => {
    if(datetime_viewers.length!==gamePlayed.data.length) throw error;
  })

  // here's an extremely inefficient for-loop... will optimize later
  var viewers_zip = []
  datetime_viewers.forEach((datetime, i) => {
    const parsedDatetime = parseDatetime(datetime);
    if(parsedDatetime >= subathonStartDate && parsedDatetime <= subathonEndDate){
      viewers_zip.push({
        timeStreamed: datetimeToHours(parsedDatetime),
        datetime: parsedDatetime,
        game: null,
        numViewers: null
      })
      for (j = 0; j < gamePlayed_viewers.length; j++) {
        if(gamePlayed_viewers[j].data[i]!==null){
          viewers_zip[viewers_zip.length-1].game = gamePlayed_viewers[j].label;
          viewers_zip[viewers_zip.length-1].numViewers = gamePlayed_viewers[j].data[i];
          break;
        }
      }
    }
  }) 

  const numViewers = viewers_zip.map(d => {return d.numViewers})
  console.log("numViewers: ", numViewers)

  console.log("viewers_zip: ", viewers_zip)

  /* --------------------------------------------- */
  // FOLLOWERS

  const datetime_followers = followersJson.data.labels;
  const num_followers = followersJson.data.datasets[1].data; // hardcoded index for "Followers"
  const delta_followers = num_followers.map((val, index) => {
    const delta = val - (num_followers[index - 1] || 0)
    return delta<=0 ? null : delta
  });

  //console.log("datetime_followers: ", datetime_followers)
  //console.log("num_followers: ", num_followers)
  //console.log("gained_followers: ", gained_followers)

  // handle error: mismatch xy length
  if (datetime_followers.length !== num_followers.length) throw error;

  const followers_zip = datetime_followers
    .map((datetime, index) => {
      return {
        timeStreamed: null,
        datetime: parseDatetime(datetime), 
        numFollowers: num_followers[index],
        gainedFollowers: delta_followers[index]
      }
    })
    .filter(followers => followers.datetime >= subathonStartDate && followers.datetime <= subathonEndDate)
    .map(followers => { 
      return {
        timeStreamed: datetimeToHours(followers.datetime),
        datetime: followers.datetime,
        numFollowers: followers.numFollowers,
        gainedFollowers: followers.gainedFollowers
      }
    });

  console.log("followers_zip: ", followers_zip)

  const gainedFollowers = followers_zip.map(d => d.gainedFollowers)
  console.log("gainedFollowers: ", gainedFollowers)

  /* --------------------------------------------- */
  // HIGHLIGHTS

  const datetime_highlights = highlightsJson.datetime;
  const type_highlights = highlightsJson.type; 
  const title_highlights = highlightsJson.title; 
  const desc_highlights = highlightsJson.desc;
  const url_highlights = highlightsJson.url;
  const embed_highlights = highlightsJson.embed;

  //console.log("datetime_highlights: ", datetime_highlights)
  //console.log("type_highlights: ", type_highlights)
  //console.log("title_highlights: ", title_highlights)
  //console.log("desc_highlights: ", desc_highlights)
  //console.log("url_highlights: ", url_highlights)
  //console.log("embed_highlights: ", embed_highlights)

  // handle error: mismatch xy length
  if (datetime_highlights.length !== type_highlights.length || 
        datetime_highlights.length !== title_highlights.length || 
        datetime_highlights.length !== desc_highlights.length || 
        datetime_highlights.length !== url_highlights.length || 
        datetime_highlights.length !== embed_highlights.length ) 
    throw error;

  const highlights_zip = datetime_highlights
    .map((datetime, index) => {
      return {
        id: index, 
        timeStreamed: null,
        datetime: parseDatetime(datetime), 
        type: type_highlights[index],
        title: title_highlights[index],
        desc: desc_highlights[index],
        url: url_highlights[index],
        embed: embed_highlights[index]
      }
    })
    .filter(highlight => highlight.datetime >= subathonStartDate && highlight.datetime <= subathonEndDate)
    .map(highlight => { 
      const xHour = datetimeToHours(highlight.datetime)
      const yHour = timeLeft_hours[timeStreamed_hours.indexOf(xHour)]
      return {
        id: highlight.id,
        timeStreamed: xHour,
        timeLeft: yHour,
        datetime: highlight.datetime,
        type: highlight.type,
        title: highlight.title,
        desc: highlight.desc,
        url: highlight.url,
        embed: highlight.embed
      }
    });

  console.log("highlights_zip: ", highlights_zip)

  /* --------------------------------------------- */
  // GRAPH

  /* --- Simple Line DEFINITIONS --- */

  // Define xy axes (timeLeft)
  var xDomain_timeLeft = [0, d3.max(timeStreamed_hours)],
      yDomain_timeLeft = [0, d3.max(timeLeft_hours)];
  var xScale_timeLeft = d3.scaleLinear().domain(xDomain_timeLeft).range([ 0, width ]),
      yScale_timeLeft = d3.scaleLinear().domain(yDomain_timeLeft).range([ height_timeLeft, 0 ]);
  var xAxis_timeLeft = d3.axisBottom(xScale_timeLeft),
      yAxis_timeLeft = d3.axisLeft(yScale_timeLeft);

  // Define xy axes (viewers)
  var xDomain_viewers = [0, d3.max(timeStreamed_hours)],
      yDomain_viewers = [0, d3.max(numViewers)];
  var xScale_viewers = d3.scaleLinear().domain(xDomain_viewers).range([ 0, width ]),
      yScale_viewers = d3.scaleLinear().domain(yDomain_viewers).range([ height_viewers, 0 ]);
  var xAxis_viewers = d3.axisBottom(xScale_viewers),
      yAxis_viewers = d3.axisLeft(yScale_viewers);

  // Define xy axes (subFollows) -- TODO: plot BOTH subs and follows
  var xDomain_subFollows = [0, d3.max(timeStreamed_hours)],
      yDomain_subFollows = [0, d3.max(gainedFollowers)];
  var xScale_subFollows = d3.scaleLinear().domain(xDomain_subFollows).range([ 0, width ]),
      yScale_subFollows = d3.scaleLinear().domain(yDomain_subFollows).range([ height_subFollows, 0 ]);
  var xAxis_subFollows = d3.axisBottom(xScale_subFollows),
      yAxis_subFollows = d3.axisLeft(yScale_subFollows);

  // Define line (timeLeft)
  var drawLine_timeLeft = d3.line()
    .defined(d => !isNaN(d.timeLeft))
    .x(d => xScale_timeLeft(d.timeStreamed))
    .y(d => yScale_timeLeft(d.timeLeft))

  // Define line (viewers)
  var drawLine_viewers = d3.line()
    .defined(d => !isNaN(d.numViewers))
    .x(d => xScale_viewers(d.timeStreamed))
    .y(d => yScale_viewers(d.numViewers))

  // Define line (subFollows)
  var drawLine_subFollows = d3.line()
    .defined(d => !isNaN(d.gainedFollowers))
    .x(d => xScale_subFollows(d.timeStreamed))
    .y(d => yScale_subFollows(d.gainedFollowers))

  /* ---------- */

  // Add x-axis (timeLeft)
  svg.append("g")
    .attr("class", "axis axis--x--timeLeft")
    .attr("transform", "translate(0," + height_timeLeft + ")")
    .call(xAxis_timeLeft);

  // Add y-axis (timeLeft)
  svg.append("g")
    .attr("class", "axis axis--y--timeLeft")
    .call(yAxis_timeLeft)

  // Add x-axis label (timeLeft)
  svg.append("text")             
    .attr("transform",
          "translate(" + (width/2) + " ," + (height_timeLeft + margin_timeLeft.top + margin_text) + ")")
    .style("text-anchor", "middle")
    .text("# hours streamed");

  // Add y-axis label (timeLeft)
  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - margin_timeLeft.left)
    .attr("x",0 - (height_timeLeft / 2))
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .text("# hours left");  

  /* ---------- */

  // Add x-axis (viewers)
  svg.append("g")
    .attr("class", "axis axis--x--viewers")
    .attr("transform", "translate(0," + (height_viewers + margin_viewers.top - margin_text) + ")")
    .call(xAxis_viewers);

  // Add y-axis (viewers)
  svg.append("g")
    .attr("class", "axis axis--y--viewers")
    .attr("transform", "translate(0," + (margin_viewers.top - margin_text) + ")")
    .call(yAxis_viewers)

  // Add x-axis label (viewers)
  svg.append("text")             
    .attr("transform",
          "translate(" + (width/2) + " ," + (height_viewers + margin_viewers.top + margin_text) + ")")
    .style("text-anchor", "middle")
    .text("# hours streamed");

  // Add y-axis label (viewers)
  svg.append("text")
    .attr("transform", "translate(0," + (margin_viewers.top - margin_text) + ") rotate(-90) ")
    .attr("y", 0 - margin_viewers.left)
    .attr("x", 0 - (height_viewers / 2))
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .text("# viewers");  

  /* ---------- */

  // Add x-axis (subFollows)
  svg.append("g")
    .attr("class", "axis axis--x--subFollows")
    .attr("transform", "translate(0," + (height_subFollows + margin_subFollows.top - margin_text) + ")")
    .call(xAxis_subFollows);

  // Add y-axis (subFollows)
  svg.append("g")
    .attr("class", "axis axis--y--subFollows")
    .attr("transform", "translate(0," + (margin_subFollows.top - margin_text) + ")")
    .call(yAxis_subFollows)

  // Add x-axis label (subFollows)
  svg.append("text")             
    .attr("transform",
          "translate(" + (width/2) + " ," + (height_subFollows + margin_subFollows.top + margin_text) + ")")
    .style("text-anchor", "middle")
    .text("# hours streamed");

  // Add y-axis label (subFollows)
  svg.append("text")
    .attr("transform", "translate(0," + (margin_subFollows.top - margin_text) + ") rotate(-90) ")
    .attr("y", 0 - margin_subFollows.left)
    .attr("x", 0 - (height_subFollows / 2))
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .text("# followers gained");  


  /* --- Brush + Line Clip DEFINITIONS --- */

  // Define animation time
  var idleTimeout,
      idleDelay = 350;

  /* ---------- */

  // Define brush (timeleft)
  var brush_timeLeft = d3.brushX()
    .extent( [ [0,0], [width, height_timeLeft] ] )
    .on("end", brushended_timeLeft)

  // Add a clipPath (timeLeft): everything out of this area won't be drawn.
  var clip_timeLeft = svg.append("defs").append("svg:clipPath")
    .attr("id", "clip_timeLeft")
    .append("svg:rect")
    .attr("width", width)
    .attr("height", height_timeLeft)
    .attr("x", 0)
    .attr("y", 0);

  // Create the line svg (timeLeft): where both the line and the brush take place
  var svg_line_timeLeft = svg.append('g')
    .attr("clip-path", "url(#clip_timeLeft)");

  // Add line (timeLeft)
  svg_line_timeLeft.append("path")
    .datum(timeLeftJson_zip)
    .attr("class", "line_timeLeft")
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 1.5)
    .attr("d", drawLine_timeLeft);

  // Add brush (timeLeft)
  svg_line_timeLeft.append("g")
    .attr("class", "brush_timeLeft")
    .call(brush_timeLeft);

  /* ---------- */

  // Define brush (viewers)
  var brush_viewers = d3.brushX()
    .extent( [ [0,0], [width, height_viewers] ] )
    .on("end", brushended_viewers)

  // Add a clipPath (viewers): everything out of this area won't be drawn.
  var clip_viewers = svg.append("defs").append("svg:clipPath")
    .attr("id", "clip_viewers")
    .append("svg:rect")
    .attr("width", width)
    .attr("height", height_viewers)
    .attr("x", 0)
    .attr("y", 0);

  // Create the line svg (viewers): where both the line and the brush take place
  var svg_line_viewers = svg.append('g')
    .attr("clip-path", "url(#clip_viewers)")
    .attr("transform", "translate(0," + (margin_viewers.top - margin_text) + ")")

  // Add line (viewers)
  svg_line_viewers.append("path")
    .datum(viewers_zip)
    .attr("class", "line_viewers")
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 1.5)
    .attr("d", drawLine_viewers);

  // Add brush (viewers)
  svg_line_viewers.append("g")
    .attr("class", "brush_viewers")
    .call(brush_viewers);

  /* ---------- */

  // Define brush (subFollows)
  var brush_subFollows = d3.brushX()
    .extent( [ [0,0], [width, height_subFollows] ] )
    .on("end", brushended_subFollows)

  // Add a clipPath (subFollows): everything out of this area won't be drawn.
  var clip_subFollows = svg.append("defs").append("svg:clipPath")
    .attr("id", "clip_subFollows")
    .append("svg:rect")
    .attr("width", width)
    .attr("height", height_subFollows)
    .attr("x", 0)
    .attr("y", 0);

  // Create the line svg (subFollows): where both the line and the brush take place
  var svg_line_subFollows = svg.append('g')
    .attr("clip-path", "url(#clip_subFollows)")
    .attr("transform", "translate(0," + (margin_subFollows.top - margin_text) + ")")

  // Add line (subFollows)
  svg_line_subFollows.append("path")
    .datum(followers_zip)
    .attr("class", "line_subFollows")
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 1.5)
    .attr("d", drawLine_subFollows);

  // Add brush (subFollows)
  svg_line_subFollows.append("g")
    .attr("class", "brush_subFollows")
    .call(brush_subFollows);

  /* --- Brush + Line Clip FUNCTIONS --- */

  function idled() {
    idleTimeout = null;
  }

  function brushended_timeLeft() {
    var brushBounds = d3.event.selection;
    if (!brushBounds) {
      if (!idleTimeout) return idleTimeout = setTimeout(idled, idleDelay);
      xScale_timeLeft.domain(xDomain_timeLeft);
      xScale_viewers.domain(xDomain_viewers);
      xScale_subFollows.domain(xDomain_subFollows);
    } else {
      xScale_timeLeft.domain([brushBounds[0], brushBounds[1]].map(xScale_timeLeft.invert, xScale_timeLeft));
      xScale_viewers.domain([brushBounds[0], brushBounds[1]].map(xScale_viewers.invert, xScale_viewers));
      xScale_subFollows.domain([brushBounds[0], brushBounds[1]].map(xScale_subFollows.invert, xScale_subFollows));
      svg_line_timeLeft.select(".brush_timeLeft").call(brush_timeLeft.move, null);
    }
    zoom_timeLeft();
    zoom_viewers();
    zoom_subFollows();
  }

  function brushended_viewers() {
    var brushBounds = d3.event.selection;
    if (!brushBounds) {
      if (!idleTimeout) return idleTimeout = setTimeout(idled, idleDelay);
      xScale_timeLeft.domain(xDomain_timeLeft);
      xScale_viewers.domain(xDomain_viewers);
      xScale_subFollows.domain(xDomain_subFollows);
    } else {
      xScale_timeLeft.domain([brushBounds[0], brushBounds[1]].map(xScale_timeLeft.invert, xScale_timeLeft));
      xScale_viewers.domain([brushBounds[0], brushBounds[1]].map(xScale_viewers.invert, xScale_viewers));
      xScale_subFollows.domain([brushBounds[0], brushBounds[1]].map(xScale_subFollows.invert, xScale_subFollows));
      svg_line_viewers.select(".brush_viewers").call(brush_viewers.move, null);
    }
    zoom_timeLeft();
    zoom_viewers();
    zoom_subFollows();
  }

  function brushended_subFollows() {
    var brushBounds = d3.event.selection;
    if (!brushBounds) {
      if (!idleTimeout) return idleTimeout = setTimeout(idled, idleDelay);
      xScale_timeLeft.domain(xDomain_timeLeft);
      xScale_viewers.domain(xDomain_viewers);
      xScale_subFollows.domain(xDomain_subFollows);
    } else {
      xScale_timeLeft.domain([brushBounds[0], brushBounds[1]].map(xScale_timeLeft.invert, xScale_timeLeft));
      xScale_viewers.domain([brushBounds[0], brushBounds[1]].map(xScale_viewers.invert, xScale_viewers));
      xScale_subFollows.domain([brushBounds[0], brushBounds[1]].map(xScale_subFollows.invert, xScale_subFollows));
      svg_line_subFollows.select(".brush_subFollows").call(brush_subFollows.move, null);
    }
    zoom_timeLeft();
    zoom_viewers();
    zoom_subFollows();
  }

  function zoom_timeLeft() {
    var t = svg.transition().duration(750);
    svg.select(".axis--x--timeLeft").transition(t).call(xAxis_timeLeft);
    svg.select(".axis--y--timeLeft").transition(t).call(yAxis_timeLeft);
    svg_line_timeLeft.selectAll(".line_timeLeft").transition(t).attr("d", drawLine_timeLeft);
    svg_line_timeLeft.selectAll("circle").transition(t)
      .attr("cx", d => xScale_timeLeft(d.timeStreamed))
      .attr("cy", d => yScale_timeLeft(d.timeLeft));
    svg_line_timeLeft.selectAll("text").transition(t)
      .attr("x", d => xScale_timeLeft(d.timeStreamed))
      .attr("y", d => yScale_timeLeft(d.timeLeft)-12);
  }

  function zoom_viewers() {
    var t = svg.transition().duration(750);
    svg.select(".axis--x--viewers").transition(t).call(xAxis_viewers);
    svg.select(".axis--y--viewers").transition(t).call(yAxis_viewers);
    svg_line_viewers.selectAll(".line_viewers").transition(t).attr("d", drawLine_viewers);
  }

  function zoom_subFollows() {
    var t = svg.transition().duration(750);
    svg.select(".axis--x--subFollows").transition(t).call(xAxis_subFollows);
    svg.select(".axis--y--subFollows").transition(t).call(yAxis_subFollows);
    svg_line_subFollows.selectAll(".line_subFollows").transition(t).attr("d", drawLine_subFollows);
  }

  /* --- Highlights DEFINITIONS --- */

  // Create tooltip
  var tooltip = d3.select("#highlights-viz")
    .append("div")
    .attr("class", "tooltip")
    .style("background-color", "white")
    .style("border", "solid")
    .style("border-width", "1px")
    .style("border-radius", "5px")
    .style("padding", "10px")

  // Show tooltip
  tooltip
    .style("opacity", 1)
    .html("<b>Title</b>" + " (<a href='xxx' target='_blank'>video</a>)</h4>" + "<br>Datetime<br><br>" + "EMBED VIDEO HERE" + "<br><br>") 

  // Add nodes (event highlights)
  svg_line_timeLeft.selectAll("circle")
    .data(highlights_zip)
    .enter().append("circle")
    .attr("cx", d => xScale_timeLeft(d.timeStreamed))
    .attr("cy", d =>  yScale_timeLeft(d.timeLeft))
    .attr("r", (d, i) => 5)
    .attr("id", d => "node" + d.id)
    .style("fill", "#fcb0b5")
    .on("mouseover", mouseover_highlights)

  /* --- Highlights FUNCTIONS --- */

  function mouseover_highlights(d, i){
    //clear previous 
    svg_line_timeLeft.selectAll("circle").style("fill", "#fcb0b5");
    svg_line_timeLeft.selectAll("#tooltip").remove();
    svg_line_timeLeft.selectAll("#tooltip_path").remove();

    // create embed html
    var html_embed;
    if (d.type=="twitch"){
      html_embed = "<iframe src='" + d.embed + parentDomain + "' frameborder='0' allowfullscreen='true' scrolling='no' height='300' width='400'></iframe>"
    }else if(d.type=="youtube"){
      html_embed = "<iframe src='" + d.embed + "' frameborder='0' allowfullscreen='true' scrolling='no' height='300' width='400'></iframe>"
    }

    // add color and text to current
    d3.select(this).transition().duration(100).style("fill", "#d30715");
    svg_line_timeLeft.selectAll("#tooltip").data([d]).enter()
      .append("text")
      .attr("id", "tooltip")
      .text(d.timeLeft.toFixed(1) + " hrs")
      .attr("x", d => xScale_timeLeft(d.timeStreamed))
      .attr("y", d => yScale_timeLeft(d.timeLeft)-12)
    tooltip
      .html("<b>" + d.title + "</b>" + " (<a href='" + d.url + "' target='_blank'>video</a>)</h4>" + "<br>" + formatDatetime(new Date) + "<br><br>" + html_embed + "<br><br>") 
  }


};


/* ------------------------------------------------------------------- */
/* ------------------------------------------------------------------- */


// read json files
d3.queue()
  .defer(d3.json, "data/timeLeft.json")
  .defer(d3.json, "data/viewers.json")
  .defer(d3.json, "data/followers.json")
  .defer(d3.json, "data/highlights.json")
  .await(createViz)
