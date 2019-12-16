d3.csv("data/evolucao-ibope-limpo.csv").then(function(csvData) {

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

  function drawChart(data, target, segment, presidents, mainChart) {

    ////////////////////////////////////////
    ////// MOBILE-DETECTING FUNCTIONS //////
    ////////////////////////////////////////

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

    /////////////////////////////////////
    ////// CHART DRAWING FUNCTIONS //////
    /////////////////////////////////////

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

    function setDimensions(chartClass) {
      /* This function determines the
      correct data visualization size
      for mobile and desktop devices.
      chartType can be either "mainChart"
      or smallMultiples, each option
      resulting in different dimensions
      for desktop */

      let dimensions = { };
      dimensions.margin = { top: 20, left: 60, right: 22, bottom: 60};


      if ( isMobile() ) {

        dimensions.height = 300 - dimensions.margin.top - dimensions.margin.bottom,
        dimensions.width  = 320 - dimensions.margin.left - dimensions.margin.right;

      } // End of if

      else if (chartClass == "main-chart") {

          dimensions.height = 300 - dimensions.margin.top - dimensions.margin.bottom,
          dimensions.width  = 800 - dimensions.margin.left - dimensions.margin.right;

      } // End of else

      else {

          dimensions.height = 300 - dimensions.margin.top - dimensions.margin.bottom,
          dimensions.width  = 700 - dimensions.margin.left - dimensions.margin.right;
      
      }

      return dimensions;

    } // End of setDimensions

    function addSvg(cssSelector, chartClass, chartId, dimensions) {
      /* This functions adds a svg on the div
      specified by cssSelector, with the parameters
      specified at dimensions. It returns the selection
      at the end as well. */

        const svg = d3.select(cssSelector)
          .append("svg")
            .attr("class", chartClass)
            .attr("id", chartId)
            .attr("height", dimensions.height + dimensions.margin.top + dimensions.margin.bottom)
            .attr("width", dimensions.width + dimensions.margin.left + dimensions.margin.right)
          .append("g")
            .attr("class", chartClass)
            .attr("id", chartId)
            .attr("transform", `translate(${dimensions.margin.left},${dimensions.margin.top})`)

    } // End of addSvg

    function addAxis(cssSelector, scales, dimensions) {
      /* This function draws the x and y axis
      of the chart, using the scales and dimensions
      that we set previously */

      function addXAxis(cssSelector, scale, dimensions) {

        if (!isMobile()) {

          const xAxis = d3.axisBottom(scale)
            .tickFormat(function(d) {

              let tickNo = d / 365;

              var tickText = tickNo > 1 ? `${tickNo} anos` : `${tickNo} ano`;

              if (tickNo == 0) {

                tickText = "Início"

              }

              return tickText;
            }) // End of function(d);
            .tickValues( d3.range ( 0, 365 * 8 + 1, 365 ) ); // Show ticks every 365 days

          let xAxisHolder = d3.select(cssSelector)
            .append("g")
            .attr("class", "x-axis")
            .attr("fill", "black")
            .attr("transform", `translate(0,${dimensions.height + 20})`)
            .call(xAxis);
            xAxisHolder.select(".domain") // Selects the axis vertical line...
              .remove()       // ...and removes it

          xAxisHolder.selectAll(".x-axis .tick text")
            .attr("class", "ordinary-tick");

          // Adds text BELOW the first tick
          xAxisHolder.select(".x-axis g.tick:first-of-type")
            .append("text")
            .attr("class", "tick-highlight")
            .text("1º mandato")
            .attr("dy", 40);

          // Adds text BELOW the halfway tick
          xAxisHolder.select(".x-axis g.tick:nth-of-type(5n)")
            .append("text")
            .attr("class", "tick-highlight")
            .text("2º mandato")
            .attr("dy", 40);

        } // End of if (isMobile)

        else {

          const xAxis = d3.axisBottom(scale)
            .tickFormat(function(d) {

              let tickNo = d / 365;

              var tickText = tickNo > 1 ? `${tickNo} anos` : `${tickNo} ano`;

              if (tickNo == 0) {

                tickText = "Início"

              }

              return tickText;
            }) // End of function(d);
            .tickValues( d3.range ( 0, 365 * 8 + 1, 365 * 4 ) ); // Show ticks every 365 days

         let xAxisHolder = d3.select(cssSelector)
            .append("g")
            .attr("class", "x-axis")
            .attr("fill", "black")
            .attr("transform", `translate(0,${dimensions.height + 20})`)
            .call(xAxis);

          xAxisHolder.select(".domain") // Selects the axis vertical line...
              .remove()       // ...and removes it

          xAxisHolder.selectAll(".x-axis .tick text")
            .attr("class", "ordinary-tick");

          // Adds text BELOW the 1st tick
          xAxisHolder.select(".x-axis g.tick:first-of-type")
              .append("text")
              .attr("class", "tick-highlight")
              .text("1º mandato")
              .attr("dy", 40);

          // Adds text BELOW the halfway tick
          let secondTick = xAxisHolder.select(".x-axis g.tick:nth-of-type(2n)");
          secondTick.append("text")
            .attr("class", "tick-highlight")
            .text("2º mandato")
            .attr("dy", 40);

        } // End of else

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

    function plotData(data, presidents, svgSelector, scales, measure, mainChart) {
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
          .curve(d3.curveStepBefore);

        const svg = d3.select(svgSelector);

        // Main lines
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

        // Pulsating points addapted from this codepen:
        // https://codepen.io/shaneparsons/pen/MpgEma

        let svg = d3.select(svgSelector)

        let realPoints = svg.selectAll(pointSelector)
          .data(data)
          .enter()
          .append("circle")
            .attr("class", "poll-point")
            .attr("cx", d => xScale(d.DIA_MANDATO))
            .attr("cy", d => yScale(d[measure]))
            .attr("r", 3)
            .attr("fill", d => d.PRESIDENTE == "Jair Bolsonaro" ? "#60c060" : "#303030" )
            .style("visibility", "hidden")

        let fakePoints = svg.selectAll("fake-point")
          .data(data)
          .enter()
          .append("circle")
            .attr("class", "fake-point poll-point")
            .attr("cx", d => xScale(d.DIA_MANDATO))
            .attr("cy", d => yScale(d[measure]))
            .attr("r", "3")
            .attr("fill", "none")
            .attr("stroke", d => d.PRESIDENTE == "Jair Bolsonaro" ? "#60c060" : "#303030" )
            .style("visibility", "hidden")

        // Adds animation to the fake point on the outside
        fakePoints.append("animate")
                    .attr("attributeType", "XML")
                    .attr("attributeName", "r")
                    .attr("from", "3")
                    .attr("to", "30")
                    .attr("dur", "1.5s")
                    .attr("repeatCount", "indefinite");

        fakePoints.append("animate")
                    .attr("attributeType", "XML")
                    .attr("attributeName", "opacity")
                    .attr("from", "1")
                    .attr("to", "0")
                    .attr("dur", "1.5s")
                    .attr("repeatCount", "indefinite");

      } // End of addPoints

      function updateChart(data, measure, presidents, svgSelector, pointSelector, mainChart) {
        /* Updates the dynamic explainer 
        text below the mais chart */

        function computeInfo(data, measure, presidents) {
          /* Helper function that calculates the values
          for the chart helper */

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


            return {
              date: dataArray[selectedIndex].DATA_PESQUISA,
              value: dataArray[selectedIndex][measure]
            }

          } // End of computeCloserMonth

          let dataBolsonaro = data.filter(d => d.key == "Jair Bolsonaro")[0].values;
          let dataOther     = data.filter(d => d.key != "Jair Bolsonaro")[0].values;

          let bolsoTime      = computeBolsoTime(dataBolsonaro);
          let bolsoMeasures   = computeClosestPoll(dataBolsonaro, bolsoTime.days, measure)
          let otherMeasures   = computeClosestPoll(dataOther, bolsoTime.days, measure);

          let significant = Math.abs(bolsoMeasures.value - otherMeasures.value) > 2 ? true : false 

          if (significant) {
            
            var comparison = bolsoMeasures.value > otherMeasures.value ? "<span class=dynamic>maior</span> que a de " : "<span class=dynamic>menor</span> que a de";

          } // End of if

          else {

            var comparison = "<span class=\"dynamic\">empatada</span> na margem de erro com a de"

          } // End of else


          let htmlContent = `<p class="chart-explainer">A pesquisa Ibope mais recente foi feita no <span class="dynamic">${bolsoTime.months}º mês</span> de mandato de <span class="bolso">Jair Bolsonaro.</span> O levantamento revelou que popularidade do presidente (ou seja, a quantidade de pessoas que consideram seu governo <strong>ótimo ou bom</strong>) é de <span class="dynamic"><strong>${bolsoMeasures.value}%</strong></span>, ${comparison} <span class="dynamic">${presidents[1]} <strong>(${otherMeasures.value}%)</strong></span> no mesmo período.</p>`;

          return {

            html: htmlContent,
            highlightDates: [ bolsoMeasures.date, otherMeasures.date ]

          }
        } // End of computeInfo

        function showPoint(pointSelector, highlightDates, mainChart) {
          /* Makes the two points relevant
          to the comparison pulsate */

          if( mainChart ) {
            let points = d3.selectAll(pointSelector)
                .style("visibility", d => highlightDates.includes(d.DATA_PESQUISA) ? "visible" : "hidden" )
            // console.log(points);
          } // End of if

        } // End of showPoint


          let explainerDiv = d3.select("div.span-holder.chart-explainer");
          let info = computeInfo(data, measure, presidents);

          explainerDiv.html(info.html);
          showPoint(pointSelector, info.highlightDates, mainChart);

      } // End of updateChart

      let filteredData = filterData(data, segment, presidents);
      
      if (mainChart) {
        // console.log("Drew points");
        addPoints(filteredData,
          svgSelector,
          ".poll-point",
          scales.x,
          scales.y,
          measure)
      } // End of if

      filteredData = nestData(filteredData);

      addLines(filteredData,
               svgSelector,
               ".president-line",
               scales.x,
               scales.y,
               measure);

      if (mainChart) {

        updateChart(filteredData,
                    measure,
                    presidents,
                    svgSelector,
                    ".poll-point",
                    mainChart);

      } // End of if


    } // End of plotData

    ///////////////////////////
    // INTERACTION FUNCTIONS //
    //////////////////////////

    function addListeners() {
      /* Adds the relevant event listeners to 
      the HTML elements of the page */

      document.querySelector("select.president-selector")
              .addEventListener("change", redrawMainChart);

      // document.querySelector("select.measure-selector")
      //         .addEventListener("change", redrawMainChart);

      window.addEventListener('resize', redrawMainChart);
      window.addEventListener('resize', redrawSmallMultiples);

    } // End of addListeners

    function redrawMainChart() {
      /* Redraws the main chart after selecting
      a new president on the dropdown or resizing 
      the screen */

      d3.selectAll('svg.main-chart')
        .remove();

      chartDimensions = setDimensions("main-chart");
      chartScales     = setScales(chartDimensions);

      console.log(chartDimensions);

      let selector = document.querySelector("select.president-selector"),
          presidentValue = selector.options[selector.selectedIndex].value;
          presidenText  = selector.options[selector.selectedIndex].text;

      selector = document.querySelector("select.measure-selector");
      let measureValue = selector.options[selector.selectedIndex].value,
          measureText  = selector.options[selector.selectedIndex].text;

      render(csvData, 
        "main-chart", 
        chartDimensions,
        chartScales, 
        [ "Jair Bolsonaro", presidentValue ], 
        true);

    } // End of redrawMainChart

    function redrawSmallMultiples() {
      /* Redraws the small multiples only
      after resizing the screen */

      d3.selectAll("div.small-multiple > svg")
        .remove();

      chartDimensions = setDimensions("smallMultiples");
      chartScales     = setScales(chartDimensions);

      render(csvData, 
        "michel-temer", 
        chartDimensions,
        chartScales, 
        [ "Jair Bolsonaro", "Michel Temer" ]);

      render(csvData, 
        "dilma-rousseff", 
        chartDimensions,
        chartScales, 
        [ "Jair Bolsonaro", "Dilma Rousseff"]);

      render(csvData, 
        "lula", 
        chartDimensions,
        chartScales, 
        [ "Jair Bolsonaro", "Lula" ]);

      render(csvData, 
        "fernando-henrique-cardoso", 
        chartDimensions,
        chartScales, 
        [ "Jair Bolsonaro", "Fernando Henrique Cardoso" ]);

      render(csvData, 
        "itamar-franco", 
        chartDimensions,
        chartScales, 
        [ "Jair Bolsonaro", "Itamar Franco" ]);

      render(csvData, 
        "fernando-collor", 
        chartDimensions,
        chartScales, 
        [ "Jair Bolsonaro", "Fernando Collor" ]);

    } // End of redrawSmallMultiples

    function render(data, target, chartDimensions, chartScales, presidents, mainChart) {

        addSvg(`.${target}`,
               target,
               target,
               chartDimensions);

        addAxis(`g.${target}`, 
                chartScales, 
                chartDimensions);

        plotData(data,
                 presidents,
                 `g.${target}`,
                 chartScales,
                 "POSITIVA",
                 mainChart);

      } // End of render

      /* Execution of drawChart() 
      starts below this line */

      addListeners();

      let chartDimensions   = setDimensions(target),
          chartScales       = setScales(chartDimensions);

      render(data, 
             target, 
             chartDimensions, 
             chartScales, 
             presidents,
             mainChart);


  } // End of draw chart
  
  csvData = parseData(csvData);
  drawChart(csvData,
            "main-chart", 
            "total", 
            [ "Jair Bolsonaro", "Michel Temer" ],
            true );

  drawChart(csvData,
            "michel-temer", 
            "total", 
            [ "Jair Bolsonaro", "Michel Temer" ]);

  drawChart(csvData,
          "dilma-rousseff", 
          "total", 
          [ "Jair Bolsonaro", "Dilma Rousseff" ]);

  drawChart(csvData,
        "lula", 
        "total", 
        [ "Jair Bolsonaro", "Lula" ]);

  drawChart(csvData,
      "fernando-henrique-cardoso", 
      "total", 
      [ "Jair Bolsonaro", "Fernando Henrique Cardoso" ]);

  drawChart(csvData,
    "itamar-franco", 
    "total", 
    [ "Jair Bolsonaro", "Itamar Franco" ]);

  drawChart(csvData,
    "fernando-collor", 
    "total", 
    [ "Jair Bolsonaro", "Fernando Collor" ]);


}) // End of d3.csv

