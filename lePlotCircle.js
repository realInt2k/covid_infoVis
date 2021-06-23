function circlePlotFunc(width, height, data = null, transit = false, timmer = 300) {
    let margin = {top: 20, right: 10, bottom: 30, left: 40};
    width = width - margin.left - margin.right;
    height = height - margin.top - margin.bottom;


    if(!transit)
    {
        d3.select("#circlePlot").selectAll("*").remove();
        svgCircle = d3.select("#circlePlot").append("svg")
            .attr("width", width)
            .attr("height", height + margin.bottom * 2 + margin.top * 2)
            .append("g").attr("id", "plotRegion") // <---------------------------------------------
            .attr("transform", "translate(" + margin.left + " " + margin.top + ")");
    } else {
        svgCircle = d3.select("#circlePlot");
    }
    if(data && globalToolsXVal && globalToolsYVal && globalToolsCircle)
    {
        let myCircles = null;
        let circleSize =
            d3.scaleLinear()
            .domain([0, globalCat[globalToolsCircle]])
            .range([1.5, 100]);
        let textSize =
            d3.scaleLinear()
                .domain([0, globalCat[globalToolsCircle]])
                .range([9, 30]);
        let x = d3.scaleLinear()
            .domain([-0.1*globalCat[globalToolsXVal], globalCat[globalToolsXVal]]) //d3.extent(data, function(d) { return d[globalToolsXVal];}))
            .range([margin.left, margin.left + 0.8*width]);
        let y = d3.scaleLinear()
            .domain([-0.1*globalCat[globalToolsYVal], globalCat[globalToolsYVal]])//d3.extent(data, function(d) { return d[globalToolsYVal];}))
            .range([height - margin.bottom, margin.top]);
        if(!transit)
        {
            svgCircle.append("g")
                .attr("id", "XAxis")
                .call(d3.axisBottom(x).tickFormat(d3.format(".2s")))
                .attr("transform", "translate(0, "+(height-margin.bottom)+")");
            svgCircle.append("g")
                .attr("id", "YAxis")
                .call(d3.axisLeft(y).tickFormat(d3.format(".2s")))
                .attr("transform", "translate("+margin.left+", 0)")
            // text label for the y axis
            svgCircle.append("text")
                .attr("id", "globalToolsYValName")
                .attr("transform", "rotate(-90)")
                .attr("y", 0 - margin.left)
                .attr("x",0 - (height / 2))
                .attr("dy", "1em")
                .style("font-size", "20px")
                .style("text-anchor", "middle")
                .text(globalToolsYVal);
            // text label for the x axis
            svgCircle.append("text")
                .attr("transform",
                    "translate(" + (width/2) + " ," +
                    (height + margin.top) + ")")
                .style("text-anchor", "middle")
                .style("font-size", "20px")
                .text(globalToolsXVal);
            // title
            svgCircle.append("text")
                .attr("transform",
                    "translate(" + (width/2) + " ," +
                    (margin.top) + ")")
                .style("text-anchor", "middle")
                .style("font-size", "20px")
                .text("Interactive slider plot - " + globalToolsCircle.replaceAll("_", " "));

        } else {
        }
        let color = d3.scaleOrdinal()
            .domain(globalCountryName)
            .range(globalCountryColor);
        let canvas = null;
        if (transit)
        {
           for(let i = 0; i < data.length; ++i)
           {
               let d = data[i];
               let id = "#c_" + toReadableCountry(d["country"]);
               let tid = "#t_" + toReadableCountry(d["country"]);
               let cx = x(d[globalToolsXVal]);
               let cy = y(d[globalToolsYVal]);
               let r = Math.sqrt(circleSize(d[globalToolsCircle]))/3.14 * 45;
               let tSize = d[globalToolsCircle];
               let cName = d["country"];
               d3.select(id).transition().duration(timmer)
                   .attr("cx", cx)
                   .attr("cy", cy)
                   .attr("r", function (d) {
                       if(globalToolsEqualCircle)
                           return 15;
                       else
                           return r;
                   })
                   .style("fill", function (d) { return color(d["country"]) } )
                   .style("opacity", 0.55);
               d3.select(tid).transition().duration(timmer)
                   .attr("x", cx)
                   .attr("y", cy)
                   .style("font-size", function(d){
                       if (globalToolsEqualCircle)
                           return "10px";
                       else
                           return textSize(tSize)+"px";
                   })
                   .style("text-anchor", "middle")
                   .text(cName);
           }
            d3.select("#plotRegion")
                .selectAll('circle')
                .data(data)
        } else {
            svgCircle.append('g')
                .selectAll('circle')
                .data(data)
                .enter()
                .append('circle')
                .attr("cx", function (d) {
                    return x(d[globalToolsXVal]);
                })
                .attr("cy", function (d) {
                    return y(d[globalToolsYVal]);
                })
                .transition()
                .duration(1000)
                .attr("r", function (d) {
                    if (globalToolsEqualCircle)
                        return 15;
                    else
                        return Math.sqrt(circleSize(d[globalToolsCircle])) / 3.14 * 45;
                })
                .style("fill", function (d) {
                    return color(d["country"])
                })
                .attr("id", function (d) {
                    return "c_" + toReadableCountry(d["country"])
                })
                .style("opacity", 0.55)
            let cName = "";
            svgCircle.append('g')
                .selectAll('text')
                .data(data)
                .enter()
                .append('text')
                .attr("id", function (d) {
                    return "t_" + toReadableCountry(d["country"])
                })
                .attr("x", function (d) {
                    return x(d[globalToolsXVal]);
                })
                .attr("y", function (d) {
                    return y(d[globalToolsYVal]);
                })
                .style("text-anchor", "middle")
                .style("font-size", function(d){
                    if (globalToolsEqualCircle)
                        return "10px";
                    else
                        return textSize(d[globalToolsCircle])+"px";
                })
                .text(function (d) {
                    return d["country"];
                });
            svgCircle.append('g').attr("id", "brush").call( d3.brush()
                .extent( [ [0,0], [width,height] ] )
                .on("start brush", function updateChart(event) {
                    extent = event.selection
                    globalCountryContents = [];
                    globalCountryContentsColor = [];
                    globalCountryContentsX = [];
                    globalCountryContentsY = [];
                    globalCountryContentsZ = [];
                    $("#countryContents").empty();
                    svgCircle.selectAll("circle").classed("selected", function(d){
                        return isBrushed(extent, x(d[globalToolsXVal]), y(d[globalToolsYVal]),
                            d["country"], color(d["country"]),
                            d[globalToolsXVal], d[globalToolsYVal], d[globalToolsCircle])
                    } )
                    for(let i = 0; i < globalCountryContents.length; ++i)
                    {
                        $("#countryContents").append("<div>- " + globalCountryContents[i] + " [" +
                            globalCountryContentsX[i] + ", " + globalCountryContentsY[i] + ", " + globalCountryContentsZ[i] + "] " +
                            '<i style="background:' + globalCountryContentsColor[i] + '"> * </i> ' +
                            "</div>");
                    }
                })
            )
        }

// A function that return TRUE or FALSE according if a dot is in the selection or not
        function isBrushed(brush_coords, cx, cy, cName, cColor, x, y, z) {
            var x0 = brush_coords[0][0],
                x1 = brush_coords[1][0],
                y0 = brush_coords[0][1],
                y1 = brush_coords[1][1];
            if(x0 <= cx && cx <= x1 && y0 <= cy && cy <= y1)
            {
                globalCountryContents.push(cName);
                globalCountryContentsColor.push(cColor);
                globalCountryContentsX.push(d3.format(".2s")(x));
                globalCountryContentsY.push(d3.format(".2s")(y));
                globalCountryContentsZ.push(d3.format(".2s")(z))
            }
            return x0 <= cx && cx <= x1 && y0 <= cy && cy <= y1;    // This return TRUE or FALSE depending on if the points is in the selected area
        }
    } else {
        let x = d3.scaleLinear()
            .domain([0, 0]) //d3.extent(data, function(d) { return d[globalToolsXVal];}))
            .range([margin.left, margin.left + 0.8*width]);
        let y = d3.scaleLinear()
            .domain([0, 0])//d3.extent(data, function(d) { return d[globalToolsYVal];}))
            .range([height - margin.bottom, margin.top]);
        svgCircle.append("g")
            .call(d3.axisBottom(x))
            .attr("transform", "translate(0, "+(height-margin.bottom)+")");
        svgCircle.append("g")
            .call(d3.axisLeft(y))
            .attr("transform", "translate("+margin.left+", 0)")
        svgCircle.append("text")
            .attr("transform",
                "translate(" + (width/2) + " ," +
                (margin.top) + ")")
            .style("text-anchor", "middle")
            .style("font-size", function(d){
                return "10px";
            })
            .text("Interactive slider plot - DEFAULT: " + globalToolsCircle.replaceAll("_", " "));
        // y name here
        svgCircle.append("text")
            .attr("id", "globalToolsYValName")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - margin.left)
            .attr("x",0 - (height / 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .style("font-size", "20px")
            .text("DEFAULT:     " + globalToolsYVal);
        // text label for the x axis
        svgCircle.append("text")
            .attr("transform",
                "translate(" + (width/2) + " ," +
                (height + margin.top) + ")")
            .style("text-anchor", "middle")
            .style("font-size", "20px")
            .text("DEFAULT:     " + globalToolsXVal);
    }

}

function toReadableCountry(c) {
    return c.replaceAll(" ", "_")
        .replaceAll("'","_")
        .replaceAll("(","_")
        .replaceAll(")","_");
}