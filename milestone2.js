$.getScript("milestone1.js", function(){
    $("#bigButton").on("click", function(){
        runner(dateIter, new Date(globalMinDate));
        for(let key in globalCountrySet){
            globalCountrySet[key] = 0;
        }
    });
}).done(function(){
})

/*
Slider to pick date for circle plot tools
 */

let emptyCanvas = true;
let prevSliderVal = 1;
function drawIt(toggleAllCountry, timmer, id)
{
    if(toggleAllCountry)
    {
        let data = getCirclePlotData(modQuickAccess, globalMapValDate[id], null);
        drawCircleOnChange(data, null, null, false, timmer)
    } else
    {
        let data = getCirclePlotData(modQuickAccess, globalMapValDate[id], globalCountrySet);
        drawCircleOnChange(data, null, null, false, timmer)
    }
}

function recalculateGlobalCat() {
    for(let key in globalCat)
        globalCat[key] = 0;
    for(let i in quickAccess) if(quickAccess[i]["data"])
    {
        let name = quickAccess[i]["name"];
        if(globalCountrySet[name])
        for(let day in quickAccess[i]["data"])
        {
            for(let key in quickAccess[i]["data"][day]) if (globalCat[key] !== null)
            {
                globalCat[key] = Math.max(globalCat[key], quickAccess[i]["data"][day][key]);
            }
        }
    }
}

function setCircleToolsBox() {
    $(document).ready(function() {
        $("#increment").on("click", function(){
            let skip = +$("#incrementInp").val();
            setTimeout(function () {
                let date = new Date(globalDate);
                date.setDate(date.getDate() + skip);
                applyChangesWithDate(formatDate(date));
                return 0;
            }, 200)
        })

        let circlePlotToolsAxesRescale = $("#circlePlotToolsAxesRescale");
        circlePlotToolsAxesRescale.on("click", function(){
            if(!toggleAllCountry) {
                recalculateGlobalCat();
            }
            else
                globalCat = JSON.parse(JSON.stringify(tmpCat));
            //console.log(globalCat);
            drawIt(toggleAllCountry, 0, prevSliderVal);
        })
        let displayCountry = $("#circlePlotToolsAxesCountrySet");
        displayCountry.on("click", function() {
            toggleAllCountry = false;
            displayCountry.removeClass("btn-light").addClass("btn-success");
            displayAll.removeClass("btn-success").addClass("btn-light");
            drawIt(toggleAllCountry, 0, prevSliderVal);
        })
        let displayAll = $("#circlePlotToolsAxesCountrySetAll");
        displayAll.on("click", function() {
            toggleAllCountry = true;
            displayAll.removeClass("btn-light").addClass("btn-success");
            displayCountry.removeClass("btn-success").addClass("btn-light");
            drawIt(toggleAllCountry, 0, prevSliderVal);
        })
        let resetSelection = $("#resetAllSelection")
        resetSelection.on("click", function(){
            for(let key in globalCountrySet){
                globalCountrySet[key] = 0;
            }
            applyChangesWithDate(globalDate);
        })
        //slider
        let slider = $("#circlePlotToolsDate");
        let cnt = 1;
        for(let date = new Date(globalMinDate); date < globalMaxDate; date.setDate(date.getDate() + 1))
        {
            globalMapValDate[cnt] = new Date(date);
            cnt += 1;
        }
        slider.attr("min", 1);
        slider.attr("max", cnt-1);
        slider.val(cnt - 1);
        prevSliderVal = slider.val();
        drawIt(toggleAllCountry, 500, prevSliderVal);

        slider.on("mouseenter", function() {
            prevSliderVal = $(this).val();
        })

        document.getElementById("circlePlotToolsDate").oninput = function() {
            let id = this.value;
            let data = null;
            if(toggleAllCountry)
                data = getCirclePlotData(modQuickAccess, globalMapValDate[id]);
            else
                data = getCirclePlotData(modQuickAccess, globalMapValDate[id], globalCountrySet);
            if(emptyCanvas) {
                drawCircleOnChange(data, null, null, false, 1000);
                emptyCanvas = false;
            }
            else
            {
                drawCircleOnChange(data, null, null, true, 200);
            }
            prevSliderVal = id;
            document.getElementById("circlePlotToolsDateContent").innerText = globalMapValDate[id];
        }
        let Content = $("#circlePlotToolsAxesContent");

        for(let key in globalCat) if(key!=="date")
        {
            let res = "<button id=tool_"+key+" class='btn-sm' style='background: #adc2db' value="+key+">"+key+"</button>";
            globalToolsBtnStatus[key] = "";
            Content.append(function() {return res})
            $("#tool_"+key).on("click", function(){
                emptyCanvas = true;
                let value = $(this).val();
                $(this).empty();
                $(this).text(value);
                let curState = globalToolsBtnStatus[value];
                let shouldTurnOff = true;
                for(let state in globalToolsbtnSelected)
                    if(globalToolsbtnSelected[state] === 0)
                    {
                        shouldTurnOff = false;
                        if(curState &&  curState !== "")
                        {
                            globalToolsbtnSelected[curState] = 0;
                        }
                        globalToolsbtnSelected[state] = 1;
                        globalToolsBtnStatus[value] = state;
                        break;
                    }
                if(shouldTurnOff) {
                    if (curState && curState !== "")
                        globalToolsbtnSelected[curState] = 0;
                    globalToolsBtnStatus[value] = "";
                }
                if(globalToolsBtnStatus[value] === "X")
                    globalToolsXVal = value;
                else if(globalToolsBtnStatus[value] === "Y")
                    globalToolsYVal = value;
                else if(globalToolsBtnStatus[value] === "O")
                    globalToolsCircle = value;
                $(this).append("<div>" + globalToolsBtnStatus[value] + "</div>");
                if(globalToolsbtnSelected['O'] === 1)
                {
                    drawIt(toggleAllCountry, 1000, prevSliderVal);
                } else
                {
                    drawIt(toggleAllCountry, 10, prevSliderVal);
                }
            })
        }
        let resetCircleSize = $("#circlePlotToolsAxesEqual");
        resetCircleSize.on("click", function(){
            if(!globalToolsEqualCircle)
            {
                globalToolsbtnSelected["O"] = 0;
                for(key in globalToolsBtnStatus)
                    if(globalToolsBtnStatus[key] === "O")
                    {
                        let btn = $("#tool_"+key);
                        let value = $(btn).val();
                        btn.empty();
                        btn.text(value);
                    }
                globalToolsEqualCircle = true;
            } else {
                globalToolsEqualCircle = false;
            }
            drawIt(toggleAllCountry, 1000, prevSliderVal);
        })
        // reset content
        let Contentbtn = $("#circlePlotToolsAxes");
        Contentbtn.on("click", function() {
            globalToolsbtnSelected = {"X":0, "Y":0, "O":0}
            for(key in globalToolsBtnStatus) {
                globalToolsBtnStatus[key] = "";
                let btn = $("#tool_"+key);
                let value = $(btn).val();
                btn.empty();
                btn.text(value);
            }
            emptyCanvas = true;
            globalToolsXVal = "new_cases", globalToolsYVal = "new_deaths", globalToolsCircle = "total_cases";
            globalToolsEqualCircle = false;
            globalCat = JSON.parse(JSON.stringify(tmpCat));
            drawIt(toggleAllCountry, 1000, prevSliderVal);
        })
    })
}

function runner(cnt, date, skip=10) {
    for(let i = 0; i < cnt - 1; ++i) {
        setTimeout(function () {
            date.setDate(date.getDate() + skip);
            //console.time("applyChangesWithDate");
            applyChangesWithDate(formatDate(date));
            //console.timeEnd("applyChangesWithDate");
            return 0;
        }, 200)
    }
}

function drawCircleOnChange(data = null, w = null, h = null, transit = false, timmer = 300) {
    $(document).ready(function(){
        let locationPlot = $("#circlePlot");
        let innerWidth = locationPlot.width();
        let innerHeight = locationPlot.height();
        circlePlotFunc(innerWidth, innerHeight, data, transit, timmer);
    })
    return 0;
}

$( window ).resize(function() {
    let data = null;
    prevSliderVal = $("#circlePlotToolsDate").val();
    if(toggleAllCountry) {
        data = getCirclePlotData(modQuickAccess, globalMapValDate[prevSliderVal], null);
    } else {
        data = getCirclePlotData(modQuickAccess, globalMapValDate[prevSliderVal], globalCountrySet);
    }
    drawCircleOnChange(data, null, null, false, 300);
});