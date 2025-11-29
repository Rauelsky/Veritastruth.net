//Move to front
d3.selection.prototype.moveToFront = function () {
    return this.each(function () {
        this.parentNode.appendChild(this);
    });
};

//Specs for 13x8 tile grid
var TGMboxWidth = 36;
var TGMboxHeight = 36;
var TGMcolumns = 13;
var TGMrows = 8;
var TGMmarginRect = 0;
var TGMmarginSVG = 8;
var TGMrectSizeIncrease = 8;

//Other specs
var TGMtextSize = TGMboxWidth / 3;
var TGMsvgWidth = (TGMcolumns * TGMboxWidth) + (TGMcolumns * TGMmarginRect) + TGMmarginRect * 2;
var TGMsvgHeight = (TGMrows * TGMboxHeight) + (TGMrows * TGMmarginRect) + TGMmarginRect * 2;

Promise.all([
    d3.csv("/static/data/vfdb.csv"),
    d3.json("/static/data/tgm-13x8-with-dc.json"),
    d3.json("/static/data/us-states-abbrev-id-alt-dc.json"),
    d3.csv("/static/data/vfdb-category-abbreviations.csv"),
    d3.json("/static/data/statesArray.json")

]).then(function (data) {

    var vfdbData = data[0];
    var TGMdata = data[1];
    var albersData = data[2];
    var statesArray = data[4];

    // ------------ //
    //  STATE DATA  //
    // ------------ //

    //Get list of states that have cases in VFDB
    var vfdbStateList = [... new Set(vfdbData.map(x => x.state))].sort()

    //Get data for graphics
    var vfdbGraphicDataStates = [];
    for (jj = 0; jj < vfdbStateList.length; jj++) {
        var thisCount = 0;
        for (rr in vfdbData) { if (vfdbData[rr].state == vfdbStateList[jj]) { thisCount++; } }

        //Get full state name
        var thisStateFull = statesArray.filter(function (bb) { return bb.abbrev == vfdbStateList[jj] })[0].fullName;
        var thisStateAP = statesArray.filter(function (bb) { return bb.abbrev == vfdbStateList[jj] })[0].abbrevAP;
        vfdbGraphicDataStates.push({ "stateAbbrev": vfdbStateList[jj], "stateFull": thisStateFull, "stateAbbrevAP": thisStateAP, "count": +thisCount })

        if (vfdbStateList[jj].length != 2) {
            throw Error("State names in file 'vfdb.csv' need to be 2 characters")
        }
    }

    //Add zeroes if state has no cases
    for (kk in statesArray) {
        if (vfdbStateList.includes(statesArray[kk].abbrev) == false) {
            vfdbGraphicDataStates.push({ "stateAbbrev": statesArray[kk].abbrev, "stateFull": statesArray[kk].fullName, "stateAbbrevAP": statesArray[kk].abbrevAP, "count": 0 })
        }
    }

    //Get max cases across all states
    var countMax = d3.max(vfdbGraphicDataStates, function (d) { return d.count; });

    //Add maximum state figure to legend
    d3.select("#stateMax").text(countMax + " cases")

    //Sort highest count to lowest
    vfdbGraphicDataStates.sort((a, b) => (b.count > a.count) ? 1 : -1)

    //Add data to TGMdata
    TGMdata.forEach(function (d) {
        //Add tile position data
        d.x = (TGMmarginSVG / 2) + (TGMmarginRect) + TGMmarginRect * (d.TGMpos % TGMcolumns) + (d.TGMpos % TGMcolumns * TGMboxWidth);
        d.y = (TGMmarginSVG / 2) + (TGMmarginRect) + (Math.floor(d.TGMpos / TGMcolumns)) * TGMboxHeight + (Math.floor(d.TGMpos / TGMcolumns)) * TGMmarginRect;
        //Add TGM data
        d.TGMdata = vfdbGraphicDataStates.filter(function (x) { return x.stateAbbrev == d.stateAbbrev })[0]
    })

    // ----------- //
    //   TGM MAP   //
    // ----------- //

    var TGMsvg = d3.select("#TGM")
        .append("svg")
        .attr("viewBox", "0 0 " + (TGMmarginSVG + TGMsvgWidth) + " " + (TGMmarginSVG + TGMsvgHeight));

    TGMsvg
        .append("g")
        .selectAll("rect")
        .data(TGMdata)
        .enter()
        .append("rect")
        .attr("x", function (d) { return d.x; })
        .attr("y", function (d) { return d.y; })
        .attr("width", TGMboxWidth)
        .attr("height", TGMboxHeight)
        .attr("class", "map-polygons")
        .attr("fill", function (d) { return "rgba(var(--base-color-rgba)," + d.TGMdata.count / countMax + ")" })
        .on("mouseover", function (event, d) {
            d3.select(this).moveToFront();
            d3.select(this).attr("stroke-width", 3)

            //Tooltip
            d3.select("#tooltip")
                .transition().duration(10)
                .style("opacity", 1)
                .style("visibility", "visible")
            var casesText = "cases"
            if (d.TGMdata.count == 1) { casesText = "case" }
            var tooltipText = "<p class='tooltipBold'>" + d.TGMdata.stateFull + "</p><p>" + d.TGMdata.count + " " + casesText + "</p><p><em>Click to Select</em></p>"
            d3.select("#tooltip").html(tooltipText)
        })
        .on("mousemove", function (event) {
            var svgWidth = +d3.select("#TGM").node().getBoundingClientRect().width;
            var svgX = +d3.select("#TGM").node().getBoundingClientRect().x;
            var tooltipWidth = d3.select("#tooltip").node().getBoundingClientRect().width;
            var tooltipHeight = d3.select("#tooltip").node().getBoundingClientRect().height;
            var mouseX = event.pageX;
            var mouseY = event.pageY;
            var tooltipX = mouseX - (tooltipWidth / 2)
            if (tooltipX < svgX) { tooltipX = svgX }
            if (tooltipX + tooltipWidth > svgWidth + svgX) { tooltipX = svgWidth - tooltipWidth + svgX }
            var tooltipY = mouseY - tooltipHeight - 12;

            d3.select("#tooltip")
                .style("top", (tooltipY + "px"))
                .style("left", (tooltipX + "px"))
        })
        .on("mouseout", function () {
            d3.select(this)
                .attr("stroke", "black")
                .attr("stroke-width", 1)
            d3.select("#tooltip")
                .transition().delay(300).duration(300)
                .style("opacity", 0)
        })
        .on("click", function (event, d) {
            navToSearchSelectedState(d.stateAbbrev)
        })

    TGMsvg
        .append("g")
        .selectAll("text")
        .data(TGMdata)
        .enter()
        .append("text")
        .attr("x", function (d) { return d.x + (TGMboxWidth / 2) })
        .attr("y", function (d) { return d.y + (TGMboxHeight / 2) })
        .attr("class", "TGM-state-labels")
        .style("text-anchor", "middle")
        .style("dominant-baseline", "central")
        .style("font-size", TGMtextSize)
        .style("fill", function (d) { if (d.TGMdata.count / countMax > .5) { return "white" } else { return "black" } })
        .text(function (d) { return d.stateAbbrev; });


    // -------------- //
    //   ALBERS MAP   //
    // -------------- //

    // Bind data to state map
    for (dd = 0; dd < vfdbGraphicDataStates.length; dd++) {
        var abbrevA = vfdbGraphicDataStates[dd].stateAbbrev;
        for (qq = 0; qq < albersData.features.length; qq++) {
            var abbrevB = albersData.features[qq].stateAbbrev
            if (abbrevA == abbrevB) {
                albersData.features[qq].properties.mapData = vfdbGraphicDataStates[dd];
                break;
            }
        }
    }

    var albersWidth = 750;
    var albersHeight = 460;

    var myprojection = d3.geoAlbersUsa()
        .translate([albersWidth / 2, albersHeight / 2])
        .scale(1000);

    var path = d3.geoPath()
        .pointRadius(6)
        .projection(myprojection);

    var albersSVG = d3.select("#albersMap")
        .append("svg")
        .style("margin", "0px")
        .attr("viewBox", "0 0 " + albersWidth + " " + albersHeight)
        .append("g")

    albersSVG.append("g").selectAll("path")
        .data(albersData.features)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("fill", function (d) { return "rgba(var(--base-color-rgba)," + d.properties.mapData.count / countMax + ")" })
        .attr("class", "map-polygons")
        .on("mouseover", function (event, d) {

            d3.select(this).moveToFront();
            d3.select(this).attr("stroke-width", 3)

            //Move DC point to front
            albersSVG.selectAll("path")
                .filter(x => x.stateAbbrev == "DC")
                .moveToFront()

            //Tooltip
            d3.select("#tooltip")
                .transition().duration(10)
                .style("opacity", 1)
            var casesText = "cases"
            if (d.properties.mapData.count == 1) { casesText = "case" }
            var tooltipText = "<p class='tooltipBold'>" + d.properties.mapData.stateFull + "</p><p>" + d.properties.mapData.count + " " + casesText + "</p><p><em>Click to Select</em></p>"
            d3.select("#tooltip").html(tooltipText)
        })
        .on("mousemove", function (event) {
            var svgWidth = +d3.select("#albersMap").node().getBoundingClientRect().width;
            var svgX = +d3.select("#albersMap").node().getBoundingClientRect().x;
            var tooltipWidth = d3.select("#tooltip").node().getBoundingClientRect().width;
            var tooltipHeight = d3.select("#tooltip").node().getBoundingClientRect().height;
            var mouseX = event.pageX;
            var mouseY = event.pageY;
            var tooltipX = mouseX - (tooltipWidth / 2)
            if (tooltipX < svgX) { tooltipX = svgX }
            if (tooltipX + tooltipWidth > svgWidth + svgX) { tooltipX = svgWidth - tooltipWidth + svgX }
            var tooltipY = mouseY - tooltipHeight - 12;

            d3.select("#tooltip")
                .style("top", (tooltipY + "px"))
                .style("left", (tooltipX + "px"))
        })
        .on("mouseout", function () {
            d3.select(this)
                .attr("stroke-width", 1)
            d3.select("#tooltip")
                .transition().delay(300).duration(300)
                .style("opacity", 0)
        })
        .on("click", function (event, d) {
            navToSearchSelectedState(d.stateAbbrev)
        })

    //Add 2-character state abbreviations
    albersSVG.append("g").selectAll("text")
        .data(albersData.features)
        .enter()
        .append("text")
        .text(function (d) { return d.stateAbbrev })
        .style("fill", function (d) { if (d.properties.mapData.count / countMax > .5) { return "white" } else { return "black" } })
        .attr("x", function (d) {
            var baseX = path.centroid(d)[0];
            if (d.stateAbbrev == "LA") { baseX -= 8 }
            if (d.stateAbbrev == "MI") { baseX += 12 }
            if (d.stateAbbrev == "KY") { baseX += 8 }
            if (d.stateAbbrev == "NY") { baseX += 6 }
            if (d.stateAbbrev == "VA") { baseX += 6 }
            if (d.stateAbbrev == "NC") { baseX += 6 }
            if (d.stateAbbrev == "WV") { baseX -= 4 }
            if (d.stateAbbrev == "FL") { baseX += 16 }
            if (d.stateAbbrev == "HI") { baseX -= 12 }
            if (d.stateAbbrev == "MN") { baseX -= 2 }
            if (d.stateAbbrev == "ME") { baseX += 2 }
            if (d.stateAbbrev == "SC") { baseX += 2 }
            return baseX;
        })
        .attr("y", function (d) {
            var baseY = path.centroid(d)[1]
            if (d.stateAbbrev == "CA") { baseY += 18 }
            if (d.stateAbbrev == "ID") { baseY += 12 }
            if (d.stateAbbrev == "MI") { baseY += 24 }
            if (d.stateAbbrev == "AK") { baseY -= 6 }
            if (d.stateAbbrev == "WV") { baseY += 5 }
            if (d.stateAbbrev == "TN") { baseY += 3 }
            if (d.stateAbbrev == "FL") { baseY += 8 }
            if (d.stateAbbrev == "HI") { baseY += 10 }
            if (d.stateAbbrev == "SC") { baseY += 2 }
            return baseY;
        })
        .attr("opacity", function (d) {
            if (d.stateAbbrev == "RI") { return 0 }
            if (d.stateAbbrev == "DC") { return 0 }
            if (d.stateAbbrev == "MD") { return 0 }
            if (d.stateAbbrev == "DE") { return 0 }
            if (d.stateAbbrev == "VT") { return 0 }
            if (d.stateAbbrev == "NH") { return 0 }
            if (d.stateAbbrev == "MA") { return 0 }
            if (d.stateAbbrev == "CT") { return 0 }
            if (d.stateAbbrev == "NJ") { return 0 }
        })
        .attr("class", "albers-map-labels")

    // ------------- //
    //   FUNCTIONS   //
    // ------------- //

    function navToSearchSelectedState(abbrev) {
        const baseUrl = window.location.origin;
        const searchUrl = `${baseUrl}/search` + "?state=" + abbrev.toLowerCase();
        window.location.href = searchUrl;
    }

})