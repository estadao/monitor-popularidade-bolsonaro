function drawChart(fp, segment, presidents) {

  /////////////////////////////////////
  ////// CHART DRAWING FUNCTIONS //////
  /////////////////////////////////////

  function parseData(data) {
    /* This function and its subfunctions
    prepare the input data so we can properly
    visualize them. This includes filtering,
    calulcating aggregations and normalizing */

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

    data = calculateDateDelta(data);
    data = sortData(data);

    return data;

  } // End of parseData

  function filterData(data, segment, presidents) {
    /* This function uses d3.filter to
    keep only the relevant datapoints */

    data = data.filter(function(d) {

      return d.SEGMENTO  == segment &&
             presidents.includes(d.PRESIDENTE);

    }) // End of d3 filter

    return data;

  } // End of filterData

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

    const yUpwardScale = d3.scaleLinear()
      .domain([0, 100]) // From 0% to 100% approval/disapproval
      .range([ dimensions.height / 2, 30 ]);

    const yDownwardScale = d3.scaleLinear()
      .domain([0, 100]) // From 0% to 100% approval/disapproval
      .range([ dimensions.height / 2 + 30, dimensions.height]);

    return {

      x: xPositionScale,
      y: yPositionScale,
      yUp: yUpwardScale,
      yDown: yDownwardScale

    };

  } // End of setScales

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
    dimensions.margin = { top: 20, left: 60, right: 20, bottom: 50};

    if ( isMobile() ) {

      
      dimensions.height = 400 - dimensions.margin.top - dimensions.margin.bottom,
      dimensions.width  = 320 - dimensions.margin.left - dimensions.margin.right;

    } // End of if

    else {

      dimensions.height = 400 - dimensions.margin.top - dimensions.margin.bottom,
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
          .attr("class", "main-chart")
          .attr("height", dimensions.height + dimensions.margin.top + dimensions.margin.bottom)
          .attr("width", dimensions.width + dimensions.margin.left + dimensions.margin.right)
        .append("g")
          .attr("class", "main-chart")
          .attr("transform", `translate(${dimensions.margin.left},${dimensions.margin.top})`)

  } // End of addSvg

  function addAxis(cssSelector, scales, dimensions) {
    /* This function draws the x and y axis
    of the chart, using the scales and dimensions
    that we set previously */

    function addXAxis(cssSelector, scale, dimensions) {

      const xAxis = d3.axisBottom(scale)
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

      d3.select(cssSelector)
        .append("g")
        .attr("class", "x-axis")
        .attr("fill", "black")
        .attr("transform", `translate(0,${dimensions.height})`)
        .call(xAxis)
        .select(".domain") // Selects the axis vertical line...
          .remove();       // ...and removes it

    } // End of addXAxis

    function addYAxis(cssSelector, scale, dimensions) {

      const yAxis = d3.axisLeft(scale)
        .tickFormat(function(d){

          return `${d}%`;

        }) // End of function(d)
        .tickSize(0 - dimensions.width) // Make the ticks occupy the whole svg, left to right
        .tickValues([0, 25, 50, 75, 100]);

      d3.select(cssSelector)
        .append("g")
        .attr("class", "y-axis")
        .attr("fill", "black")
        .call(yAxis)
        .select(".domain") // Selects the axis vertical line...
          .remove();       // ...and removes it

    } // End of addYAxis

    addXAxis(cssSelector, scales.x, dimensions);
    addYAxis(cssSelector, scales.y, dimensions);

  } // End of addAxis

  function plotData(data, presidents, svgSelector, scales, measure) {
    /* Proccess the data and plots
    the relevant datapoints */

    function addLines(data, svgSelector, lineSelector, xScale, yScale, measure) {
      /* This function draws the lines 
      representing the actual datapoints */

      const lineGenerator = d3.line()
        .x(function(d) {
          return xScale(+d.DIA_MANDATO);
        })
        .y(function(d){
          return yScale(+d[measure]);
        })
        .curve(d3.curveStep);

      const svg = d3.select(svgSelector);

      svg.selectAll(lineSelector)
        .data(data)
        .enter()
          .append("path")
          .attr("class", "president-line")
          .attr("id", function(d){
            let id = d.key.toLowerCase();
                id = id.replace(/ /g, '-'); // Regex to remove spaces
            return `line-${id}`; 
          })
          .attr("fill", "none")
          .attr("stroke-width", 3)
          .attr("stroke", function(d){
            if (d.key === "Jair Bolsonaro") {
              return "#60c060"
            }
            else {
              return "#303030";
            }
          })
          .attr("d", function(d){
            return lineGenerator(d.values);
          })

    } // End of addLines

    function addPoints(data, svgSelector, pointSelector, xScale, yScale, measure) {

    } // End of addPoints

    function updateExplainer(data, measure, presidents) {
      /* Updates the dynamic explainer 
      text below the mais chart */

      function computeInfo(data, measure, presidents) {

        function computeBolsoTime(dataArray) {
          /* This functions how many days passed
          from the beginning of Bolsonaro's term
          to the latest poll. It then divides the
          day count by 30 to estimate the numbers
          of months that have passed since them */

          let dayCounts = dataArray.map(d => d.DIA_MANDATO);
          let passedDays = d3.max(dayCounts)

          return {

           days: passedDays,
           months: Math.round(passedDays / 30)

          };

        } // End of computeBolsoMonth

        function computeClosestPoll(dataArray, bolsoDays, measure) {
          /* This functions receives an int as an argument:
          how many months after Bolsonaro's term start the 
          last poll was released; it then uses this number 
          to find the poll that was released the closer to
          this time interval for another president */

          let dayCounts = dataArray.map(d => d.DIA_MANDATO);

          let selectedIndex = 0;
          let smallerDiff = 99999;
          for (i = 0; i < dayCounts.length; i++) {

            let diff = Math.abs(dayCounts[i] - bolsoDays);
            // console.log("smallerDiff is", smallerDiff)
            // console.log("Computing",  dayCounts[i], "-", bolsoDays)
            // console.log("this diff is", diff)

            if (diff < smallerDiff) {
              // console.log("replacing smallerDiff")
              smallerDiff = diff;
              selectedIndex = i;
            } // End of if

          } // End of for

          return dataArray[selectedIndex][measure];

        } // End of computeCloserMonth

        console.log("Compute info", presidents);

        let dataBolsonaro = data.filter(d => d.key == "Jair Bolsonaro")[0].values;
        let dataOther     = data.filter(d => d.key != "Jair Bolsonaro")[0].values;

        console.log(dataOther);
        let bolsoTime      = computeBolsoTime(dataBolsonaro);
        let bolsoMeasure   = computeClosestPoll(dataBolsonaro, bolsoTime.days, measure)
        let otherMeasure   = computeClosestPoll(dataOther, bolsoTime.months, measure);

        let comparison = bolsoMeasure > otherMeasure ? "maior" : "menor";

        let htmlContent = `<p class="chart-explainer">A pesquisa Ibope mais recente foi feita no <span class="dynamic">${bolsoTime.months}º mês</span> de mandato de <span class="bolso">Jair Bolsonaro.</span> O levantamento revelou que popularidade do presidente (ou seja, a quantidade de pessoas que consideram seu governo <strong>ótimo ou bom</strong>) é de <span class="dynamic"><strong>${bolsoMeasure}%</strong></span>, <span class="dynamic"> <strong>${comparison}</strong></span> que a de <span class="dynamic">${presidents[1]} <strong>(${otherMeasure}%)</strong></span> no mesmo período.</p>`;

        return htmlContent;

      } // End of computeInfo



      let explainerDiv = d3.select("div.span-holder.chart-explainer");

      console.log(presidents);
      let info = computeInfo(data, measure, presidents);
      explainerDiv.html(info);

    } // End of updateExplainer 

    let filteredData = filterData(data, segment, presidents);
        filteredData = nestData(filteredData);

    addLines(filteredData,
             svgSelector,
             ".preisdente-line-up",
             scales.x,
             scales.y,
             measure);

    console.log(presidents);
    updateExplainer(filteredData,
                    measure,
                    presidents);

  } // End of plotData

  ////////////////////////////
  // STARTS EXECUTION AFTER //
  //   READING THE CSV IN   //
  ////////////////////////////

  d3.csv(fp).then(function(csvData) {

    ///////////////////////////
    // INTERACTION FUNCTIONS //
    //////////////////////////

    function addListeners() {
      /* Adds the relevant event listeners to 
      the HTML elements of the page */

      document.querySelector("select.president-selector")
              .addEventListener("change", redrawLines);

      document.querySelector("select.measure-selector")
              .addEventListener("change", redrawLines);

    } // End of addListeners

    function redrawLines() {
      /* Redraws the chart after selecting
      a new president on the dropdown */

      console.log("Redraw!");

      d3.selectAll('.president-line')
        .attr("stroke-width", 0)
        .remove();

      let selector = document.querySelector("select.president-selector"),
          presidentValue = selector.options[selector.selectedIndex].value;
          presidenText  = selector.options[selector.selectedIndex].text;

      selector = document.querySelector("select.measure-selector");
      let measureValue = selector.options[selector.selectedIndex].value,
          measureText  = selector.options[selector.selectedIndex].text;

      plotData(csvData,
               [ "Jair Bolsonaro", presidentValue ],
               "g.main-chart",
               chartScales,
               measureValue);

    } // End of redrawLines

    /* Execution of drawChart() 
    starts below this line */

    addListeners();

    csvData = parseData(csvData);

    const chartDimensions = setDimensions(),
          chartScales     = setScales(chartDimensions);

    addSvg(".chart", 
           chartDimensions);

    addAxis("g.main-chart", 
            chartScales, 
            chartDimensions);

    plotData(csvData,
             presidents,
             "g.main-chart",
             chartScales,
             "POSITIVA");


  }) // End of d3.csv


} // End of draw chart

drawChart("../data/evolucao-ibope-limpo.csv", "total", [ "Jair Bolsonaro", "Michel Temer" ] );