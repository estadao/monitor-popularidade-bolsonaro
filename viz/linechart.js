function isMobile() {
  /*
  This functions detects if the screen
  of the device is mobile (width smaller than
  800) and returns true if positive,
  false if nefative.
  */
   if(window.innerWidth <= 800) {

     return true;

   } // End of if

   else {

     return false;

   } // End of else

} // End of isMobile()

function draw(fp, president, segment) {
  /*
  This function draws a streamchart using 
  the datafile passed as `fp`, which should 
  always be 'dados-concatenados.csv'. It limits 
  the datapoints to those in which the column 
  `presidente` is equal to `pres` and `segmento`
  is equal to `segment`.
  */

  if (isMobile()) {
    // Sets the size for mobile devices
    var margin = { top: 20, right: 30, bottom: 0, left: 10 },
        width  = 320 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;
  
  } // End of if

  else {
    // Sets the size for desktop devices
    var margin = { top: 20, right: 30, bottom: 0, left: 10 },
        width  = 800 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;
  } // End of else


  // Reads the data in
  d3.csv(fp, function(datapoints) {

    // Filter data to keep only the relevant
    // president and segments
    datapoints = datapoints.filter(function(d) {
      return (d.presidente == president) && 
             (d.segmento == segment);
    })

    // Retrieves the maximum and minimum dates
    // so that we can later set a scale
    var timeParse = d3.timeParse("%m/%Y");
    var dateRange = d3.extent(datapoints.map(function(d){
      return timeParse(d.data_pesquisa);
    }))
    console.log(dateRange);

    console.log("Datapoints:", datapoints);

    // Converting the selection to wide format
    // I don't know what is actually going on
    // here, but hopefully Soma does:
    // http://jonathansoma.com/tutorials/d3/wide-vs-long-data/
    datapoints = d3.nest()
      .key(function(d) {
        return d.data_pesquisa;
      })
      .rollup(function(d){
        return d.reduce(function(prev, curr) {
          prev.data_pesquisa = curr.data_pesquisa;
          prev[curr.resposta] = curr.valor;
          return prev;
        }, {});
      })
      .entries(datapoints)
      .map(function(d) {
        return d.value;
      });

    console.log("Wide:", datapoints);

    // Now we must calculate the approval and disapproval ratings
    // and discard the unnecessary variables
    for (i=0; i < datapoints.length; i++) {
      datapoints[i]["aprovacao"]    = +datapoints[i]["bom"] + +datapoints[i]["otimo"];
      datapoints[i]["desaprovacao"] = +datapoints[i]["ruim"] + +datapoints[i]["pessimo"];

      var toDelete = [ "otimo", "bom", "regular", "ruim", "pessimo", "nao_sabe_nao_respondeu" ];

      for (j=0; j < toDelete.length; j++) {
        delete datapoints[i][toDelete[j]];
      } // End of for

    } // End of for

    console.log("Aggregated: ", datapoints);

    // Now we can TURN IT TO LONG FORMAT AGAIN
    // OMG this is insane why am I not using pandas?
    var longDatapoints = [ ];
    datapoints.forEach( function(row) {
      // Loop through all of the columns, and for each column
      // make a new row
      Object.keys(row).forEach( function(colname) {
        // Ignore 'State' and 'Value' columns
        if(colname == "data_pesquisa") {
          return
        }
        longDatapoints.push({"data_pesquisa": row.data_pesquisa, "valor": row[colname], "resposta": colname});
      });
    });

    datapoints = longDatapoints;
    delete longDatapoints;
    console.log("Long and Aggregated:", datapoints);

    // NOW WE NEST IT AGAIN
    // THIS IS  BEYOND INSANITY
    // ARGHhhhhhHHhhHhHhhhHhH *noises*
    datapoints = d3.nest()
      .key(function(d){
        return d.resposta;
      })
      .entries(datapoints);

    console.log("Nested:", datapoints);


    // Sets the scales
    var xPositionScale = d3.scaleLinear()
      .domain(dateRange)
      .range([0, width]);

    var yPositionScale = d3.scaleLinear()
      .domain([0, 100])
      .range([height, 0]);

    var colorScale = d3.scaleOrdinal()
      .domain(["aprovacao", "desaprovacao"])
      .range([ "#1a9641", "#d7191c" ]);

  // Adds an svg
  var svg = d3.select(".chart")
    .append("svg")
      .attr("class", "streamgraph")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

    // Adds the line
    svg.selectAll(".line")
      .data(datapoints)
      .enter()
        .append("path")
        .attr("fill", "none")
        .attr("stroke", function(d){
          return colorScale(d.key);
        })
        .attr("stroke-width", 1.5)
        .attr("d", function(d) {
          console.log(d);
          return d3.line()
            .x(function(d) { 
              console.log(d);
              return xPositionScale(timeParse(d.data_pesquisa)); 
            })
            .y(function(d) { 
              console.log(d);
              return yPositionScale(+d.valor);
            })
            (d.values)
        });


  }); // end of d3.csv

}; // End of draw

draw("../data/dados-concatenados.csv", "jair_bolsonaro", "total");