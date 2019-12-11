console.log("This is streamgraph.js")


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

function draw(fp, pres, segment) {
  /*
  This function draws a streamchart using 
  the datafile passed as `fp`, which should 
  always be 'dados-concatenados.csv'. It limits 
  the datapoints to those in which the column 
  `presidente` is equal to `pres` and `segmento`
  is equal to `segment`.
  */

  var parseTime = d3.timeParse("%m/%Y");

  function drawDesktop(fp, pres, segment) {
    /* 
    Convenience function that 
    draws the visualization
    for desktop devices
    */

    console.log("not mobile!")

    // Sets the size for desktop devices
    var margin = { top: 20, right: 30, bottom: 0, left: 10 },
        width  = 800 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

    // Adds an svg
    var svg = d3.select(".chart")
      .append("svg")
        .attr("class", "streamgraph")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform",
              "translate(" + margin.left + "," + margin.top + ")");

    d3.csv(fp, function(datapoints) {

      // Filtering the dataframe
      datapoints = datapoints.filter(function(d) {
        return (d.presidente == pres) && 
               (d.segmento == segment);
      })

      console.log(datapoints);

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

      // Now we must combine
      console.log(datapoints);

      // Adding scales
      var xDomain = d3.extent(["01/2019", "12/2022"], function(d) {
          return parseTime(d);
        });
      var xPositionScale = d3.scaleLinear()
        .domain(xDomain)
        .range([ 0, width ]);

      var yDomain = [ -50, 50 ];
      var yPositionScale = d3.scaleLinear()
        .domain(yDomain)
        .range([ height, 0]);

      const keys = [ "otimo", "bom", "regular", "ruim", "pessimo", "nao_sabe_nao_respondeu" ]
      var colorScale = d3.scaleOrdinal()
        .domain(keys)
        .range([ "#1a9641", "#a6d96a", "#ffffbf", "#fdae61", "#d7191c", "#e3e3e3" ])

      // The data should be stacked
      var stackedData = d3.stack()
        .offset(d3.stackOffsetSilhouette)
        .order(d3.stackOrderReverse)
        .keys(keys)
        (datapoints);

      // Area generator
      var area = d3.area()
        .curve(d3.curveStepBefore)
        .x(function(d) { 
          return xPositionScale(parseTime(d.data.data_pesquisa)); 
        })
        .y0(function(d) { 
          return yPositionScale(d[0]); 
        })
        .y1(function(d) { 
          return yPositionScale(d[1]); 
        })

      svg
        .selectAll(".layer")
        .data(stackedData)
        .enter()
        .append("path")
          .attr("class", "area-stream")
          .style("fill", function(d) { return colorScale(d.key); })
          .attr("d", area);

    }) // End of d3.csv

  } // End of drawDesktop(fp, pres)


  function drawMobile(fp, pres) {
    /* 
    Convenience function that 
    draws the visualization
    for mobile devices
      */

    console.log("is mobile!")

    alert("mobile viz not implemented yet :/")
  } // End of drawMobile(fp, pres)


  if (isMobile()) {

    drawMobile(fp, pres, segment);

  }

  else {

    drawDesktop(fp, pres, segment);

  }


} // End of draw(fp, pres)

draw("../data/dados-concatenados.csv", "jair_bolsonaro", "total");