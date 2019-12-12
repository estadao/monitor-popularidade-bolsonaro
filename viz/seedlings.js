function drawChart(fp, segment, president) {

  function parseData(data) {
    /* This function and its subfunctions
    prepare the input data so we can properly
    visualize them. This includes filtering,
    calulcating aggregations and normalizing */

    function filterData(data, segment, president) {
      /* This function uses d3.filter to
      keep only the relevant datapoints */

      if (president) {

        data = data.filter(function(d) {

          return d.SEGMENTO   == segment &&
                 d.PRESIDENTE == president;

          }) // End of d3.filter

      } // End of if


      else {

        data = data.filter(function(d) {

          return d.SEGMENTO == segment;

        }) // End of d3.filter

      } // End of else

      return data;

    } // Enf of filterData

    function calculateDateDelta(data) {
      /* This function calculates the difference
      between the day a survey was mande and the 1st
      day of the president's term – that is, it computes
      for how long the president was serving when the 
      survey was made.
      */

      const presidentialTerms = {

        "José Sarney"               : { "inicio" : "1985-03-15" },
        "Fernando Collor"           : { "inicio" : "1990-03-15" },
        "Itamar Franco"             : { "inicio" : "1992-10-02" }, 
        "Fernando Henrique Cardoso" : { "inicio" : "1995-01-01" },
        "Lula"                      : { "inicio" : "2003-01-01" },
        "Dilma Rousseff"            : { "inicio" : "2011-01-01" },
        "Michel Temer"              : { "inicio" : "2016-05-12" }, 
        "Jair Bolsonaro"            : { "inicio" : "2019-01-01" }

      };

      for ( let datum of data ) {

        let president = datum.PRESIDENTE;

        let termStart = presidentialTerms[president]["inicio"];
            termStart = new Date(termStart);
            
        let surveyDate = datum.DATA_PESQUISA;
            surveyDate = new Date(surveyDate);

        let diff = surveyDate.getTime() - termStart.getTime();
            diff = diff / (1000 * 3600 * 24) // Milliseconds to days

        datum["DIA_MANDATO"] = diff;

      } // End of for

      return data;

    } // End of calculateDateDelta

    function sortData(data) {

      data = data.sort(function(a, b){
        return a.DIA_MANDATO - b.DIA_MANDATO;
      })

      return data;

    }

    function nestData(data) {
      /* This function groups the data
      by using the d3.nest function.
      Then, it returns the results */

      data = d3.nest()
        .key(function(d){
          return d.PRESIDENTE;
        })
        .entries(data);

      return data;

    } // End of nestData;


    data = filterData(data, segment, president);
    data = calculateDateDelta(data);
    data = sortData(data);
    data = nestData(data);

    return data;

  } // End of parseData

  function setDimensions() {
    /* This function determines the
    correct data visualization size
    for mobile and desktop devices */

    function isMobile() {
      /*
      This function detects if the screen
      of the device is mobile (width smaller than
      800). It returns `true`` if positive,
      `false` if negative.
      */
      if(window.innerWidth <= 800) {

         return true;

      } // End of if

      else {

         return false;

      } // End of else

    } // End of isMobile()


    let dimensions = { };
    dimensions.margin = { top: 20, left: 30, right: 20, bottom: 50};

    if ( isMobile() ) {

      
      dimensions.height = 500 - dimensions.margin.top - dimensions.margin.bottom,
      dimensions.width  = 320 - dimensions.margin.left - dimensions.margin.right;

    } // End of if

    else {

      dimensions.height = 500 - dimensions.margin.top - dimensions.margin.bottom,
      dimensions.width  = 800 - dimensions.margin.left - dimensions.margin.right;

    } // End of else

    return dimensions;

  } // End of setDimensions

  function addSvg(cssSelector, dimensions) {
    /* This functions adds a svg on the div
    specified by cssSelector, with the parameters
    specified at dimensions. It returns the selection
    at the end as well. */

      const svg = d3.select(cssSelector)
        .append("svg")
          .attr("height", dimensions.height + dimensions.margin.top + dimensions.margin.bottom)
          .attr("width", dimensions.width + dimensions.margin.left + dimensions.margin.right)
        .append("g")
          .attr("transform", `translate(${dimensions.margin.left},${dimensions.margin.top})`)

      return svg;

  } // End of addSvg

  function setScales(dimensions) {
    /* This function uses the width and height specified
    in dimensions to calculate the x and y position scales.
    It uses d3 built-in methods to do so. */

    const xPositionScale = d3.scaleLinear()
      .domain([ 1, 2920 ]) // From the first day in power to the last day of the second term
      .range([0, dimensions.width]);

    const yPositionScale = d3.scaleLinear()
      .domain([0, 100]) // From 0% to 100% approval/disapproval
      .range([ dimensions.height, 0 ]);

    return {

      x: xPositionScale,
      y: yPositionScale

    };

  } // End of setScales

  function addAxis(svg, scales, dimensions) {
    /* This function draws the x and y axis
    of the chart, using the scales and dimensions
    that we set previously */

    function addXAxis(svg, scales, dimensions) {

      const xAxis = d3.axisBottom(scales.x)
        .tickFormat(function(d) {

          let tick = d / 365;
          
          if (tick == 1) {
            tick = "1º ano";
          }
          else if (tick == 7) {
            tick = "8ª ano";
          }
          else {
            tick = "";
          }

          return tick;
        }) // End of function(d);
        .tickValues( d3.range ( 365, 365 * 7 + 1, 365 ) ); // Show ticks every 365 days

      svg.append("g")
        .attr("class", "x-axis")
        .attr("fill", "black")
        .attr("transform", `translate(0,${dimensions.height})`)
        .call(xAxis)
        .select(".domain") // Selects the axis vertical line...
          .remove();       // ...and removes it

    } // End of addXAxis

    function addYAxis(svg, scales, dimensions) {

      const yAxis = d3.axisLeft(scales.y)
        .tickFormat(function(d){

          return `${d}%`;

        }) // End of function(d)
        .tickSize(0 - dimensions.width) // Make the ticks occupy the whole svg, left to right

      svg.append("g")
        .attr("class", "y-axis")
        .call(yAxis)
        .select(".domain") // Selects the axis vertical line...
          .remove();      // ...and removes it

    } // End of addYAaxis

    addXAxis(svg, scales, dimensions);
    addYAxis(svg, scales, dimensions);

  } // End of addAxis

  function addLines(data, svg, scales) {
    /* This function draws the lines 
    representing the actual datapoints */

    const lineGenerator = d3.line()
      .x(function(d) {
        return scales.x(+d.DIA_MANDATO);
      })
      .y(function(d){
        return scales.y(+d.POSITIVA);
      })
      .curve(d3.curveCatmullRom);


    svg.selectAll(".president-line")
      .data(data)
      .enter()
        .append("path")
        .attr("class", ".president-line")
        .attr("id", function(d){
          let id = d.key.toLowerCase();
              id = id.replace(/ /g, '-'); // Regex to remove spaces
          return `line-${id}`; 
        })
        .attr("fill", "none")
        .attr("stroke-width", 3)
        .attr("stroke", function(d){
          if (d.key === "Jair Bolsonaro") {
            return "#19c119"
          }
          else {
            return "#e3e3e3";
          }
        })
        .attr("d", function(d){
          return lineGenerator(d.values);
        })
        .on("mouseover", function(d){

          let element = d3.select(this);
              element.attr("stroke", "red")

        })
        .on("mouseout", function(d){

          let element = d3.select(this);
              element.attr("stroke", "#e3e3e3");

        })

  } // End of addLines

  /* Execution of drawChart() 
     starts below this line */

  d3.csv(fp).then(function(csvData) {

    csvData = parseData(csvData);

    const dimensions = setDimensions();
    const scales = setScales(dimensions);
    const svg = addSvg( ".chart", dimensions );
    addAxis(svg, scales, dimensions);
    addLines(csvData, svg, scales)

    console.log(csvData);

  }) // End of d3.csv


} // End of draw chart

drawChart("../data/datafolha.csv", "total");
// drawChart("../data/datafolha.csv", "total", "Jair Bolsonaro");