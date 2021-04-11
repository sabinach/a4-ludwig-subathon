import { Course } from './utils.js';

// video embed settings
var parentDomain = "127.0.0.1" // deploy: 6859-sp21.github.io
                               // test: 127.0.0.1

console.log("parentDomain: ", parentDomain);

/* ---------------------- */

// set canvas dimensions
var svg_width = 650;
var svg_height = 750;

// set the dimensions and margins
var margin_timeLeft = { top: 40, right: 60, bottom: 450, left: 45 };
var height_timeLeft = svg_height - margin_timeLeft.top - margin_timeLeft.bottom;

var margin_viewers = { top: 360, right: 60, bottom: 250, left: 45 };
var height_viewers = svg_height - margin_viewers.top - margin_viewers.bottom;

var margin_subFollows = { top: 563, right: 60, bottom: 50, left: 45 };
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

/* ---------------------- */

// set the dimensions and margins of the graph
var margin_treemap = {top: 15, right: 8, bottom: 10, left: 5},
  width_treemap = 425 - margin_treemap.left - margin_treemap.right,
  height_treemap = 300 - margin_treemap.top - margin_treemap.bottom;

// append the svg_treemap object to the body of the page
var svg_treemap = d3.select("#treemap-viz")
  .append("svg")
    .attr("width", width_treemap + margin_treemap.left + margin_treemap.right)
    .attr("height", height_treemap + margin_treemap.top + margin_treemap.bottom)
  .append("g")
    .attr("transform",
          "translate(" + margin_treemap.left + "," + margin_treemap.top + ")");

/* ---------------------- */
// utils

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
var formatDatetime = d3.timeFormat("%B %d, %Y %H:%M %p")

var formatTime = d3.timeFormat("%B %d, %Y");

console.log("subathonStartDate: ", subathonStartDate) 
console.log("subathonEndDate: ", subathonEndDate) // TODO -- update!

var bisectHour = d3.bisector(function(d) { return d.timeStreamed; }).left;


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
  const gameImagesJson = args[4];

  console.log("gameImagesJson: ", gameImagesJson)

  /* --------------------------------------------- */
  // TIME LEFT / SUBS GAINED

  // reformat xy data (timeLeftJson)
  const timeStreamed_hours = Array.from(Array(timeLeftJson.timeLeft.length), (_,x) => x*0.5);
  const timeLeft_hours = timeLeftJson.timeLeft.map(d => parseTimeLeft(d));

  console.log("timeStreamed_hours: ", timeStreamed_hours)
  console.log("timeLeft_hours: ", timeLeft_hours)

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
      for (var j = 0; j < gamePlayed_viewers.length; j++) {
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
  // TREEMAP

  // Create game output json based on start/end dates
  function generateGamePlayedCount(viewers_zip, start, end, type){
    var gamePlayed_count = [
      {"game":"Origin","count": 0,"parent":""}
    ]

    // filter by date and sum the # of games occurred within count
    viewers_zip.forEach((viewers) => {
      var withinBounds;
      if (type==="datetime"){
        withinBounds = viewers.datetime >= start && viewers.datetime <= end;
      }else if(type==="hour"){
        withinBounds = viewers.timeStreamed >= start && viewers.timeStreamed <= end;
      }
      if (withinBounds){
        var foundIndex = gamePlayed_count.findIndex(gamePlayed => gamePlayed.game === viewers.game);
        if (foundIndex>=0){
          gamePlayed_count[foundIndex].count += 1
        }else{
          gamePlayed_count.push({"game":viewers.game,"count":1,"parent":"Origin"});
        }
      }
    })

    console.log("gamePlayed_count (before): ", gamePlayed_count)

    // make sure no elements is less than 1% of total
    gamePlayed_count = gamePlayed_count.filter(d => (d.count/gamePlayed_count.reduce((accum,item) => accum + parseInt(item.count), 0)*100).toFixed(1) > 0.5 || d.game==="Origin")

    console.log("gamePlayed_count (filtered): ", gamePlayed_count)

    return gamePlayed_count
  }

  var gamePlayed_count = generateGamePlayedCount(viewers_zip, subathonStartDate, subathonEndDate, "datetime")

  /** -------- **/
  // treemap hierarchy

  // stratify the data: reformatting for d3.js
  var root = d3.stratify()
    .id(function(d) { return d.game; })   // Name of the entity (column name is name in csv)
    .parentId(function(d) { return d.parent; })   // Name of the parent (column name is parent in csv)
    (gamePlayed_count);


  // delete and redraw the treemap
  function redrawTreemap(start, end, type){

    // get new gamePlayed count
    gamePlayed_count = generateGamePlayedCount(viewers_zip, start, end, type)

    root = d3.stratify()
      .id(function(d) { return d.game; })   // Name of the entity (column name is name in csv)
      .parentId(function(d) { return d.parent; })   // Name of the parent (column name is parent in csv)
      (gamePlayed_count);
    
    root
      .sum(function(d) { return +d.count })   // Compute the numeric value for each entity
      .sort(function(a, b) { return b.height - a.height || b.value - a.value; });

    // Then d3.treemap computes the position of each element of the hierarchy
    d3.treemap()
      .size([width_treemap, height_treemap])
      .padding(0.1)
      (root)

    // animation transition time
    const duration = 100;

    /** -------- **/
    // rectangle

    // create rectangle object
    const rects = svg_treemap.selectAll(".rect").data(root.leaves())

    //remove rectangle
    rects.exit().remove();
    rects
      .attr("transform", d => `translate(${d.x0},${d.y0})`)
      .attr("width", d => d.x1 - d.x0)
      .attr("height", d => d.y1 - d.y0)

    // add rectangle
    rects.enter().append("rect")
        .attr("class", "rect")
        .attr("transform", d => `translate(${d.x0},${d.y0})`)
        .attr("width", d => d.x1 - d.x0)
        .attr("height", d => d.y1 - d.y0)
        .style("stroke", "black")
        .style("fill", "#9cbdd9")
        .style("opacity", 1e-6)
      .transition().duration(duration)
        .style("opacity", 1)

    /** -------- **/
    // title

    // create title object
    const title = svg_treemap.selectAll(".title").data(root.leaves())

    //remove title
    title
      .exit().remove()

    // transform title
    title
      .html(d => `<tspan style='font-weight: 500'>${d.data.game}</tspan>`)
      .attr("transform", d => `translate(${d.x0},${d.y0})`)

    // add title
    title.enter().append("text")
        .attr("class", "title")
        .attr("transform", d => `translate(${d.x0}, ${d.y0})`)
        .attr("dx", 5)  // +right
        .attr("dy", 13) // +lower
        .html(d => `<tspan style='font-weight: 500'>${d.data.game}</tspan>`)
        .style("font-size", "8px")
        .style("fill", "black")
        .style("opacity", 1e-6)
      .transition().duration(duration)
        .style("opacity", 1)

    /** -------- **/
    // percent

    // create percent object
    const percent = svg_treemap.selectAll(".percent").data(root.leaves())

    //remove percent
    percent
      .exit().remove()

    // transform percent
    percent
      .html(d => `<tspan style='font-weight: 500'>${(d.data.count/gamePlayed_count.reduce((accum,item) => accum + parseInt(item.count), 0)*100).toFixed(1) + "%"}</tspan>`)
      .attr("transform", d => `translate(${d.x0},${d.y0})`)

    // add percent
    percent.enter().append("text")
        .attr("class", "percent")
        .attr("transform", d => `translate(${d.x0}, ${d.y0})`)
        .attr("dx", 5)  // +right
        .attr("dy", 23) // +lower
        .html(d => `<tspan style='font-weight: 500'>${(d.data.count/gamePlayed_count.reduce((accum,item) => accum + parseInt(item.count), 0)*100).toFixed(1) + "%"}</tspan>`)
        .style("font-size", "8px")
        .style("fill", "black")
        .style("opacity", 1e-6)
      .transition().duration(duration)
        .style("opacity", 1)

    /** -------- **/
    /*
    // and to add the text labels
    svg_treemap
      .selectAll("image")
      .data(root.leaves())
      .enter()
      .append("image")
        .attr("x", function(d){ return d.x0+5})   // +right
        .attr("y", function(d){ return d.y0+26})  // +lower
        .attr("width", d => 25)
        .attr("xlink:href", d => gameImagesJson[d.data.game]);
    */
  }

  redrawTreemap(subathonStartDate, subathonEndDate, "datetime")

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

  // Define area (timeLeft)
  var drawArea_timeLeft = d3.area()
    .defined(d => !isNaN(d.timeLeft))
    .x(d => xScale_timeLeft(d.timeStreamed))
    .y0(yScale_timeLeft(0))
    .y1(d => yScale_timeLeft(d.timeLeft))

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
          "translate(" + width + " ," + (height_timeLeft + margin_timeLeft.top - 10) + ")")
    .style("text-anchor", "middle")
    .text("# hours streamed");

  // Add y-axis label (timeLeft)
  svg.append("text")
    .attr("transform", "translate(0, -10)")
    .style("text-anchor", "middle")
    .text("# Hours Left");  

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
          "translate(" + width + " ," + (height_viewers + margin_viewers.top + 10) + ")")
    .style("text-anchor", "middle")
    .text("# hours streamed");

  // Add y-axis label (viewers)
  svg.append("text")
    .attr("transform", "translate(0," + (margin_viewers.top - margin_text - 10) + ")")
    .style("text-anchor", "middle")
    .text("# Viewers");  

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
          "translate(" + width + " ," + (height_subFollows + margin_subFollows.top + 10) + ")")
    .style("text-anchor", "middle")
    .text("# hours streamed");

  // Add y-axis label (subFollows)
  svg.append("text")
    .attr("transform", "translate(0," + (margin_subFollows.top - margin_text - 10) + ")")
    .style("text-anchor", "middle")
    .text("# New Followers");  

  /* --- Focus / Hover DEFINITIONS --- */

  // Define focus text (date)
  var focus_text_date = svg.append("g")
    .append("text")
    .attr("transform", "translate(" + (-32) + ", " + (-30) + ")")
    .style("font-weight", "bold")
    .style("opacity", 1)

  // Define focus circle (timeLeft)
  var focus_circle_timeLeft = svg.append("g")
    .append("circle")
    .style("fill", "black")
    .attr("stroke", "black")
    .attr("r", 3)
    .style("opacity", 0)

  // Define focus text (timeLeft)
  var focus_text_timeLeft = svg.append("g")
    .append("text")
    .style("opacity", 0)

  // Define vertical line (timeLeft)
  var focus_vertLine_timeLeft = svg.append("g")
    .append("line")
    .attr("class", "vert-hover-line hover-line")
    .attr("y1", 0)
    .attr("y2", height_timeLeft)
    .style("opacity", 0)

  // Define focus circle (viewers)
  var focus_circle_viewers = svg.append("g")
    .append("circle")
    .style("fill", "black")
    .attr("stroke", "black")
    .attr("r", 3)
    .style("opacity", 0)
    .attr("transform", "translate(0," + (margin_viewers.top - margin_text) + ")")

  // Define focus text (viewers)
  var focus_text_viewers = svg.append("g")
    .append("text")
    .style("opacity", 0)
    .attr("transform", "translate(0," + (margin_viewers.top - margin_text) + ")")

  // Define vertical line (viewers)
  var focus_vertLine_viewers = svg.append("g")
    .append("line")
    .attr("class", "vert-hover-line hover-line")
    .attr("y1", 0)
    .attr("y2", height_viewers)
    .style("opacity", 0)
    .attr("transform", "translate(0," + (margin_viewers.top - margin_text) + ")")

  // Define focus circle (subFollows)
  var focus_circle_subFollows = svg.append("g")
    .append("circle")
    .style("fill", "black")
    .attr("stroke", "black")
    .attr("r", 3)
    .style("opacity", 0)
    .attr("transform", "translate(0," + (margin_subFollows.top - margin_text) + ")")

  // Define focus text (subFollows)
  var focus_text_subFollows = svg.append("g")
    .append("text")
    .style("opacity", 0)
    .attr("transform", "translate(0," + (margin_subFollows.top - margin_text) + ")")

  // Define vertical line (subFollows)
  var focus_vertLine_subFollows = svg.append("g")
    .append("line")
    .attr("class", "vert-hover-line hover-line")
    .attr("y1", 0)
    .attr("y2", height_subFollows)
    .style("opacity", 0)
    .attr("transform", "translate(0," + (margin_subFollows.top - margin_text) + ")")

  function mouseoutFocus(){
    focus_circle_timeLeft.style("opacity", 0)
    focus_text_timeLeft.style("opacity", 0)
    focus_vertLine_timeLeft.style("opacity", 0)
    focus_circle_viewers.style("opacity", 0)
    focus_text_viewers.style("opacity", 0)
    focus_vertLine_viewers.style("opacity", 0)
    focus_circle_subFollows.style("opacity", 0)
    focus_text_subFollows.style("opacity", 0)
    focus_vertLine_subFollows.style("opacity", 0)
    focus_text_date.style("opacity", 0)
  }

  function mousemoveFocus(){
    // timeLeft
    var x0_timeLeft = xScale_timeLeft.invert(d3.mouse(this)[0]),
        i_timeLeft = bisectHour(timeLeftJson_zip, x0_timeLeft, 1),
        selectedData_timeLeft = timeLeftJson_zip[i_timeLeft]
    if(selectedData_timeLeft){
      var xTransformed_timeLeft = xScale_timeLeft(selectedData_timeLeft.timeStreamed),
          yTransformed_timeLeft = yScale_timeLeft(selectedData_timeLeft.timeLeft)
      focus_circle_timeLeft
        .attr("cx", xTransformed_timeLeft)
        .attr("cy", yTransformed_timeLeft)
        .style("opacity", 1)
      focus_text_timeLeft
        .html(selectedData_timeLeft.timeLeft.toFixed(1) + " hrs")
        .attr("x", xTransformed_timeLeft + 5)
        .attr("y", yTransformed_timeLeft - 25)
        .style("opacity", 1)
      focus_vertLine_timeLeft
        .attr("x1", xTransformed_timeLeft)
        .attr("y1", height_timeLeft)
        .attr("x2", xTransformed_timeLeft)
        .attr("y2", 0)
        .style("opacity", 1)
    }else{
      focus_circle_timeLeft.style("opacity", 0)
      focus_text_timeLeft.style("opacity", 0)
      focus_vertLine_timeLeft.style("opacity", 0)
    }

    // viewers
    var x0_viewers= xScale_viewers.invert(d3.mouse(this)[0]),
        i_viewers = bisectHour(viewers_zip, x0_viewers, 1),
        selectedData_viewers = viewers_zip[i_viewers]
    if(selectedData_viewers){ 
      var xTransformed_viewers = xScale_viewers(selectedData_viewers.timeStreamed),
          yTransformed_viewers = yScale_viewers(selectedData_viewers.numViewers)
      focus_circle_viewers
        .attr("cx", xTransformed_viewers)
        .attr("cy", yTransformed_viewers)
        .style("opacity", 1)
      focus_text_viewers
        .html(selectedData_viewers.numViewers + " viewers")
        .attr("x", xTransformed_viewers + 5)
        .attr("y", yTransformed_viewers - 25)
        .style("opacity", 1)
      focus_vertLine_viewers
        .attr("x1", xTransformed_viewers)
        .attr("y1", height_viewers)
        .attr("x2", xTransformed_viewers)
        .attr("y2", 0)
        .style("opacity", 1)
    }else{
      focus_circle_viewers.style("opacity", 0)
      focus_text_viewers.style("opacity", 0)
      focus_vertLine_viewers.style("opacity", 0)
    }

    // subfollows
    var x0_subFollows = xScale_subFollows.invert(d3.mouse(this)[0]),
        i_subFollows = bisectHour(followers_zip, x0_subFollows, 1),
        selectedData_subFollows = followers_zip[i_subFollows]
    if(selectedData_subFollows){ 
      var xTransformed_subFollows = xScale_subFollows(selectedData_subFollows.timeStreamed),
          yTransformed_subFollows = yScale_subFollows(selectedData_subFollows.gainedFollowers)
      focus_circle_subFollows
        .attr("cx", xTransformed_subFollows)
        .attr("cy", yTransformed_subFollows)
        .style("opacity", 1)
      focus_text_subFollows
        .html(selectedData_subFollows.gainedFollowers + " follows")
        .attr("x", xTransformed_subFollows + 5)
        .attr("y", yTransformed_subFollows - 25)
        .style("opacity", 1)
      focus_vertLine_subFollows
        .attr("x1", xTransformed_subFollows)
        .attr("y1", height_subFollows)
        .attr("x2", xTransformed_subFollows)
        .attr("y2", 0)
        .style("opacity", 1)
    }else{
      focus_circle_subFollows.style("opacity", 0)
      focus_text_subFollows.style("opacity", 0)
      focus_vertLine_subFollows.style("opacity", 0)
    }

    // date
    if(selectedData_timeLeft || selectedData_viewers || selectedData_subFollows){
      focus_text_date
        .text("") // TODO - Math.round(x0_timeLeft*2)/2
        .style("opacity", 1)
    }else{
      focus_text_date.style("opacity", 0)
    }

  }

  /* --- Brush + Line Clip DEFINITIONS --- */

  // Define animation time
  var idleTimeout,
      idleDelay = 350;

  /* ---------- */

  // Define line svg (timeLeft): where both the line and the brush take place
  var svg_line_timeLeft = svg.append('g')
    .attr("clip-path", "url(#clip_timeLeft)");

  // Define brush (timeleft)
  var brush_timeLeft = d3.brushX()
    .extent( [ [0,0], [width, height_timeLeft] ] )
    .on("end", brushended_timeLeft)

  // Define clipPath (timeLeft): everything out of this area won't be drawn.
  var clip_timeLeft = svg.append("defs").append("svg:clipPath")
    .attr("id", "clip_timeLeft")
    .append("svg:rect")
    .attr("width", width)
    .attr("height", height_timeLeft)
    .attr("x", 0)
    .attr("y", 0);

  // Add line (timeLeft)
  svg_line_timeLeft.append("path")
    .datum(timeLeftJson_zip)
    .attr("class", "line_timeLeft")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 1.5)
    .attr("fill", "none")
    .attr("d", drawLine_timeLeft)
    //.attr("fill", "#cce5df")
    //.attr("d", drawArea_timeLeft)

  // Add brush + hover (timeLeft)
  svg_line_timeLeft.append("g")
    .attr("class", "brush")
    .call(brush_timeLeft)
    .on('mousemove', mousemoveFocus)
    .on('mouseout', mouseoutFocus);


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
    .call(brush_viewers)
    .on('mousemove', mousemoveFocus)
    .on('mouseout', mouseoutFocus);

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
    .call(brush_subFollows)
    .on('mousemove', mousemoveFocus)
    .on('mouseout', mouseoutFocus);

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
      // reset treemap
      redrawTreemap(subathonStartDate, subathonEndDate, "datetime")
    } 
    else {
      // do not move this -- must be before xScale domain shift!
      var newStart = [brushBounds[0], brushBounds[1]].map(xScale_timeLeft.invert, xScale_timeLeft)[0]; 
      var newEnd = [brushBounds[0], brushBounds[1]].map(xScale_timeLeft.invert, xScale_timeLeft)[1];

      // update domain for line graphs
      xScale_timeLeft.domain([brushBounds[0], brushBounds[1]].map(xScale_timeLeft.invert, xScale_timeLeft));
      xScale_viewers.domain([brushBounds[0], brushBounds[1]].map(xScale_viewers.invert, xScale_viewers));
      xScale_subFollows.domain([brushBounds[0], brushBounds[1]].map(xScale_subFollows.invert, xScale_subFollows));
      svg_line_timeLeft.select(".brush_timeLeft").call(brush_timeLeft.move, null);

      // update treemap range
      redrawTreemap(newStart, newEnd, "hour")
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
      // reset treemap
      redrawTreemap(subathonStartDate, subathonEndDate, "datetime")
    } else {
      // do not move this -- must be before xScale domain shift!
      var newStart = [brushBounds[0], brushBounds[1]].map(xScale_viewers.invert, xScale_viewers)[0]; 
      var newEnd = [brushBounds[0], brushBounds[1]].map(xScale_viewers.invert, xScale_viewers)[1];

      xScale_timeLeft.domain([brushBounds[0], brushBounds[1]].map(xScale_timeLeft.invert, xScale_timeLeft));
      xScale_viewers.domain([brushBounds[0], brushBounds[1]].map(xScale_viewers.invert, xScale_viewers));
      xScale_subFollows.domain([brushBounds[0], brushBounds[1]].map(xScale_subFollows.invert, xScale_subFollows));
      svg_line_viewers.select(".brush_viewers").call(brush_viewers.move, null);

      // update treemap range
      redrawTreemap(newStart, newEnd, "hour")
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
      // reset treemap
      redrawTreemap(subathonStartDate, subathonEndDate, "datetime")
    } else {
      // do not move this -- must be before xScale domain shift!
      var newStart = [brushBounds[0], brushBounds[1]].map(xScale_subFollows.invert, xScale_subFollows)[0]; 
      var newEnd = [brushBounds[0], brushBounds[1]].map(xScale_subFollows.invert, xScale_subFollows)[1];

      xScale_timeLeft.domain([brushBounds[0], brushBounds[1]].map(xScale_timeLeft.invert, xScale_timeLeft));
      xScale_viewers.domain([brushBounds[0], brushBounds[1]].map(xScale_viewers.invert, xScale_viewers));
      xScale_subFollows.domain([brushBounds[0], brushBounds[1]].map(xScale_subFollows.invert, xScale_subFollows));
      svg_line_subFollows.select(".brush_subFollows").call(brush_subFollows.move, null);

      // update treemap range
      redrawTreemap(newStart, newEnd, "hour")
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

  /* --- Information Tooltip DEFINITIONS --- */

  //style="width:300px; height:100px; padding: 10px; border: 1px solid black"

  // Create tooltip
  var tooltip_info = d3.select("#info-viz")
    .append("div")
    .attr("class", "tooltip_info")
    .style("background-color", "white")
    .style("border", "solid")
    .style("border-width", "1px")
    .style("border-radius", "5px")
    .style("padding", "10px")
    .style("margin-bottom", "10px")
    .style("width", "400px")

  tooltip_info
    .html("<b>Some cool timeframe-specific statistics</b>" + "<br>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.") 

  /* --- Highlights Tooltip DEFINITIONS --- */

  // Create tooltip
  var tooltip_highlights = d3.select("#highlights-viz")
    .append("div")
    .attr("class", "tooltip_highlights")
    .style("background-color", "white")
    .style("border", "solid")
    .style("border-width", "1px")
    .style("border-radius", "5px")
    .style("padding", "10px")
    .style("width", "400px")

  // "<b>" + highlights_zip[0].title + "</b>" + " (<a href='" + highlights_zip[0].url + "' target='_blank'>video</a>)</h4>" + "<br>" + formatDatetime(highlights_zip[0].datetime) + " EST" + "<br>" + getHtmlEmbed(highlights_zip[0].type, highlights_zip[0].embed, parentDomain) + "<br>"
  // "<br><br>time streamed: " + highlights_zip[0].timeStreamed.toFixed(2) + " hrs" + "<br>time left: " + highlights_zip[0].timeLeft.toFixed(2) + " hrs" +

  // Show tooltip (show the first highlight event)
  tooltip_highlights
    .style("opacity", 1)
    .html("<b>" + highlights_zip[2].title + "</b><br>" + formatDatetime(highlights_zip[2].datetime) + " EST" + " (<a href='" + highlights_zip[2].url + "' target='_blank'>video</a>)" + "<br><br>" + getHtmlEmbed(highlights_zip[2].type, highlights_zip[2].embed, parentDomain) + "<br>") 

  // Add nodes (event highlights)
  svg_line_timeLeft.selectAll(".dot-highlight")
    .data(highlights_zip)
    .enter().append("circle")
    .attr("class", "dot-highlight")
    .attr("cx", d => xScale_timeLeft(d.timeStreamed))
    .attr("cy", d =>  yScale_timeLeft(d.timeLeft))
    .attr("r", (d, i) => 6)
    .attr("id", d => "node" + d.id)
    .style("fill", "#fcb0b5")
    .style("opacity", 1) // initialize ON
    .on("mouseover", mouseover_highlights) //TODO

  /* --- Highlights Tooltip FUNCTIONS --- */

  // create embed html
  function getHtmlEmbed(type, embed, parentDomain){
    var htmlEmbed;
    if (type=="twitch"){
      htmlEmbed = "<iframe src='" + embed + parentDomain + "' frameborder='0' allowfullscreen='true' scrolling='no' height='300' width='400'></iframe>"
    }else if(type=="youtube"){
      htmlEmbed = "<iframe src='" + embed + "' frameborder='0' allowfullscreen='true' scrolling='no' height='300' width='400'></iframe>"
    }
    return htmlEmbed
  }

  function mouseover_highlights(d, i){
    // only if ON
    if (svg_line_timeLeft.selectAll(".dot-highlight").style("opacity") === "1"){
      //clear previous 
      svg_line_timeLeft.selectAll(".dot-highlight").style("fill", "#fcb0b5");
      svg_line_timeLeft.selectAll("#tooltip_highlights").remove();
      svg_line_timeLeft.selectAll("#tooltip_path").remove();

      // add color and text to current
      d3.select(this).transition().duration(100).style("fill", "#d30715");
      svg_line_timeLeft.selectAll("#tooltip_highlights").data([d]).enter()
        .append("text")
        .attr("id", "tooltip_highlights")
        .text(d.timeLeft.toFixed(1) + " hrs")
        .attr("x", d => xScale_timeLeft(d.timeStreamed))
        .attr("y", d => yScale_timeLeft(d.timeLeft)-12)

      // update tooltip
      tooltip_highlights
        .html("<b>" + d.title + "</b><br>" + formatDatetime(d.datetime) + " EST" + " (<a href='" + d.url + "' target='_blank'>video</a>)" + "<br><br>" + getHtmlEmbed(d.type, d.embed, parentDomain) + "<br>") 
    }
  }

  /* --------------------------------------------- */
  // RADIO TOGGLE

  function clearModeExcept(mode){
    // remove the following modes

    if(mode!=="byHighlights"){
      svg_line_timeLeft.selectAll(".dot-highlight")
        .style("opacity", 0)
      svg_line_timeLeft.selectAll("#tooltip_highlights").remove();
      svg_line_timeLeft.selectAll("#tooltip_path").remove();
    }

    if(mode!=="byActivity"){
    }

    if(mode!=="byLudwigModcast"){
    }

    if(mode!=="byDayNight"){
    }

  }

  d3.selectAll(("input[name='mode']")).on("change", function(){
    clearModeExcept(this.value);

    if(this.value === "byHighlights"){
      // clear previous graphs
      svg_line_timeLeft.selectAll(".line_timeLeft").remove();
      svg_line_timeLeft.selectAll(".area_timeLeft").remove();
      // redraw line
      svg_line_timeLeft.append("path")
        .datum(timeLeftJson_zip)
        .attr("class", "area_timeLeft")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1.5)
        .attr("fill", "none")
        .attr("d", drawLine_timeLeft)
        //.attr("fill", "#cce5df")
        //.attr("d", drawArea_timeLeft)

      svg_line_timeLeft.selectAll(".dot-highlight")
        .style("opacity", 1)
    }

    else if(this.value === "byActivity"){
      // clear previous graphs
      svg_line_timeLeft.selectAll(".line_timeLeft").remove();
      svg_line_timeLeft.selectAll(".area_timeLeft").remove();

      svg_line_timeLeft.append("path")
        .datum(timeLeftJson_zip)
        .attr("class", "area_timeLeft")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1.5)
        //.attr("fill", "none")
        //.attr("d", drawLine_timeLeft)
        .attr("fill", "#cce5df")
        .attr("d", drawArea_timeLeft)

      Course();
    }

    else if(this.value === "byLudwigModcast"){
      
    }

    else if(this.value === "byDayNight"){
      
    }
  });

  /* --------------------------------------------- */
  // RESET BUTTON

  var resetButton = d3.select("#reset-button")
  resetButton
    .on("click", () => resetZoom());

  function resetZoom(){
    // reset domains
    xScale_timeLeft.domain(xDomain_timeLeft);
    xScale_viewers.domain(xDomain_viewers);
    xScale_subFollows.domain(xDomain_subFollows);
    // reset line graphs
    zoom_timeLeft();
    zoom_viewers();
    zoom_subFollows();
    // reset treemap
    redrawTreemap(subathonStartDate, subathonEndDate, "datetime")
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
  .defer(d3.json, "data/gameImages.json")
  .await(createViz)
