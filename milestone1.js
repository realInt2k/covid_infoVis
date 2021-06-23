document.getElementById('mapid').setAttribute("style", "height:100%; width:100%");
mymap = L.map('mapid').setView([35.5384, 129.3114], 2);
L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
    id: 'mapbox/streets-v11',
    tileSize: 512,
    usage: 'pk',
    default: false,
    zoomOffset: -1,
    accessToken: 'pk.eyJ1IjoiaW50Mmt1bmlzdCIsImEiOiJja3BjbXNuYjMwMGNmMnFudmdocTkxbnpkIn0.Rh1GunZnQ_4oDDtHXsNBUg'
}).addTo(mymap);
let southWest = L.latLng(-92.98155760646617, -210),
    northEast = L.latLng(92.99346179538875, 210);
let bounds = L.latLngBounds(southWest, northEast);
mymap.setMaxBounds(bounds);
mymap.on('drag', function() {
    mymap.panInsideBounds(bounds, { animate: false });
});
/*------------------------------------------------------------------------------------------------------*/

// Functions of Legend and Info
title.onAdd = function() {
    let div = L.DomUtil.create('div', 'info legend');
    div.innerHTML = "Date (yyyy-mm-dd): " + globalDate;
    return div;
}

legend.onAdd = function () {
    let div = L.DomUtil.create('div', 'info legend'),
        labels = [], grades = [];
    let maximum = globalMaximum;
    grades = [0, 1/7*maximum, 2/7*maximum, 3/7*maximum, 4/7*maximum, 5/7*maximum, 6/7*maximum];
    for(let i = 0; i < grades.length; i++) {
        labels[i] = convertToReadable(grades[i]);
    }
    // loop through our density intervals and generate a label with a colored square for each interval
    for (let i = 0; i < grades.length; i++) {
        if(i + 1 < grades.length)
            div.innerHTML +='<i style="background:' + getColor2(grades[i] + 1) + '"></i> ' +
                labels[i] + " - " + labels[i + 1] + "<br/>";
        else
            div.innerHTML +='<i style="background:' + getColor2(grades[i] + 1) + '"></i> ' +
                labels[i] + ' + ' + "<br/>";
    }

    return div;
};

info.onAdd = function () {
    this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
    this.update(-1);
    return this._div;
};

// method that we will use to update the control based on feature properties passed
info.update = function (covidInfo) {
    this._div.innerHTML = getCovidInfo(covidInfo);
};
info.addTo(mymap);
/*--------------------------------------------------------------------------------*/
// Load data time
let jqxhr = $.getJSON( "owid-covid-data2.json", function( data ) {
    let geometryDash = $.getJSON( "countriesCompressed.geojson", function (geo) {
        globalGeoGraphy = geo;
        geo = bindingData(geo, data);
        makeQuickCountryCode(geo);
        makeQuickAccess(geo);
        findGlobalMaxMinDate(geo, drawCircleOnChange());
        setCircleToolsBox();

        globalCat = getAllCat(geo);
        tmpCat = JSON.parse(JSON.stringify(globalCat));
        console.log("globalCat: ", globalCat);
        modQuickAccess = modifiedQuickAccess(quickAccess);
        console.log("modded quick Access: ", modQuickAccess);
        globalData = geo;
        console.log("geo data: ", geo);
        getAllCountry();
        //date picker controler-------------------------------------------------------------------------------
        let dateControl = document.querySelector('input[type="date"]');
        dateControl.value = '2021-01-01';
        $('#datePicker').on('input', function() {
            globalDate = dateControl.value;
            applyChangesWithDate(globalDate);
        });
        /*----------------------------------------------------------------------------------------------------*/
        visual(geo)
    });
})
    .done(function(json) {
    })
    .fail(function() {
        console.log( "error?" );
    })
jqxhr.always(function() {
});


// utilities ---------------------------------------------------------------------------------------------
function findMaxCases(geo, date, dateIndependent = false) { // itereate thru the whole data to find max.

    let res = 0;
    for(let i in geo["features"]) {
        let item = geo["features"][i];
        if(item["covidInfo"] && item["covidInfo"]["data"])
            for(let j in item["covidInfo"]["data"])
            {
                if(!dateIndependent)
                {
                    if(item["covidInfo"]["data"][j]["date"] && item["covidInfo"]["data"][j]["date"] === date) {
                        if(item["covidInfo"]["data"][j]["total_cases"]) {
                            res = Math.max(res, item["covidInfo"]["data"][j]["total_cases"])
                        }
                    }
                } else
                {
                    if(item["covidInfo"]["data"][j]["total_cases"]) {
                        res = Math.max(res, item["covidInfo"]["data"][j]["total_cases"])
                    }
                }
            }
    }
    return res;
}

function getCovidInfo(covidInfo) {
    let str = '';
    if(covidInfo === -1) {
        str += "Hover over a region";
    } else
    if(!covidInfo ) {
        str += '<h4>No information for Covid found</h4>';
    } else {
        str += '<b> Country admin: ' + '</b><br/>'+covidInfo["location"]+'<br/>';
        let totalCases = -1;
        let totalDeaths = -1;
        let location = covidInfo["location"];
        let countryCode = getCountryCode[location];
        if(quickAccess[countryCode]["data"]&&
            quickAccess[countryCode]["data"][globalDate] &&
            quickAccess[countryCode]["data"][globalDate]["total_cases"])
        {
            totalCases = quickAccess[countryCode]["data"][globalDate]["total_cases"];
        }
        if(quickAccess[countryCode]["data"]&&
            quickAccess[countryCode]["data"][globalDate] &&
            quickAccess[countryCode]["data"][globalDate]["total_deaths"])
        {
            totalDeaths = quickAccess[countryCode]["data"][globalDate]["total_deaths"];
        }
        str += '<h4>Covid Info:</h4>' +  (covidInfo ?
            '<b>' + 'Total Confirmed Cases: ' + '</b><br/>' +
            (totalCases === -1?"Unknown":convertToReadable(totalCases)) + '<br />' +
            '<b>' + 'Total Confirmed Deaths: ' + '</b><br/>' +
            (totalDeaths === -1?"Unknown":convertToReadable(totalDeaths)) +'<br />'
            : 'Hover over a region');
    }
    return str;
}
// -------------------------------------------------------------------------------------------------------

// click on country
function alertLatLng(e) {
    /*if(prevLat && prevLng) {
        mymap.removeLayer(marker);
    }
    marker = L.marker([e.latlng.lat, e.latlng.lng]).addTo(mymap);
    prevLat = e.latlng.lat;
    prevLng = e.latlng.lng;*/
    layer = e.target;
    let feature = layer.feature;
    let countryName = "";
    if(feature["covidInfo"] && feature["covidInfo"]["location"]) {
        countryName = feature["covidInfo"]["location"];
        if(globalCountrySet[countryName] === 0)
        {
            globalCountrySetCnt += 1;
            globalCountrySet[countryName] = 1;
            layer.setStyle({
                weight: 3,
                color: '#ff0000',
                dashArray: '',
                fillOpacity: 0.9
            });

            if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
                layer.bringToFront();
            }
            //layer.bindPopup("selected");
        } else
        {
            globalCountrySetCnt -= 1;
            globalCountrySet[countryName] = 0;
            //layer.bindPopup("un-selected")
        }
    }
    let dat = [];
    if(feature["covidInfo"] && feature["covidInfo"]["data"]) {
        for(let i = 0; i < feature["covidInfo"]["data"].length; ++i) {
            date = feature["covidInfo"]["data"][i].date;
            value = feature["covidInfo"]["data"][i]["total_cases"] ? feature["covidInfo"]["data"][i]["total_cases"] : 0;
            dat.push({"date":date, "value":value});
        }
    }
    for (let i = 0; i < dat.length; ++i){
        dat[i].date = d3.timeParse("%Y-%m-%d")(dat[i].date);
    }
    lePlot(dat, countryName);
}
function resetHighlight(e) {
    geojson.resetStyle(e.target);
    layer = e.target;
    let feature = layer.feature;
    if(feature["covidInfo"] && feature["covidInfo"]["location"]) {
        countryName = feature["covidInfo"]["location"];
        if(globalCountrySet[countryName] === 1)
        {
            layer.setStyle({
                weight: 3,
                color: '#ff0000',
                dashArray: '',
                fillOpacity: 0.9
            });
            if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
                layer.bringToFront();
            }
        }
    }
    info.update(-1);
}
function highlightFeature(e) {
    let layer = e.target;

    layer.setStyle({
        weight: 3,
        color: '#157b2a',
        dashArray: '',
        fillOpacity: 0.7
    });

    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
        layer.bringToFront();
    }
    if(layer.feature["covidInfo"])
        info.update(layer.feature["covidInfo"]);
    else
        info.update(-1);
}

function getColor(d) {
    return d > 1000 ? '#800026' :
        d > 500  ? '#BD0026' :
            d > 200  ? '#E31A1C' :
                d > 100  ? '#FC4E2A' :
                    d > 50   ? '#FD8D3C' :
                        d > 20   ? '#FEB24C' :
                            d > 10   ? '#FED976' :
                                '#FFEDA0';
}

function getColor2(d, maximum = 33143662,
                   pallette = defaultPallette) {
    let interval = [0, 1/7*maximum, 2/7*maximum, 3/7*maximum, 4/7*maximum, 5/7*maximum, 6/7*maximum, maximum];
    for (let i = 1; i < interval.length; i++) {
        if(d <= interval[i]) {
            return pallette[i-1];
        }
    }
}

function onEachFeature(feature, layer) {
    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
        click: alertLatLng
    });
}

function geoDraw(geo) {
    geojson = L.geoJSON(geo, {
        style: function covidStyle(feature) { // in my data it will just pass indices of geo["features"]
            let colorcode = 0;
            let countryCode = feature["properties"]["ISO_A3"];
            let countryName = feature["properties"]["ADMIN"];
            if(quickAccess[countryCode]["data"]) {
                if(quickAccess[countryCode]["data"][globalDate] &&
                    quickAccess[countryCode]["data"][globalDate]["total_cases"]) {
                    colorcode = getColor2(quickAccess[countryCode]["data"][globalDate]["total_cases"], globalMaximum);
                } else {
                    colorcode = 0; // no info.
                }
            }
            if(globalCountrySet[countryName])
            {
                return {
                    fillColor: colorcode,
                    weight: 3,
                    color: '#ff0000',
                    dashArray: '',
                    fillOpacity: 0.9
                }
            } else
            return {
                fillColor: colorcode,
                weight: 2,
                opacity: 1,
                color: 'white',
                dashArray: '3',
                fillOpacity: 0.7
            };
        },
        onEachFeature: onEachFeature,
    });
    geojson.addTo(mymap);
}

function visual(geo)
{
    globalMaximum = findMaxCases(geo, globalDate, true);
    title.addTo(mymap);
    legend.addTo(mymap);
    geoDraw(geo);
}

function applyChangesWithDate(date) {
    globalDate = date;
    if(marker)
        mymap.removeLayer(marker);
    mymap.removeLayer(title);
    title.addTo(mymap);
    //legend.addTo(mymap);
    mymap.removeLayer(geojson);
    geoDraw(globalGeoGraphy);
}

function convertToReadable(number) {
    let tmp = Math.round(number);
    let digitsCount = tmp === 0? 1 : 0;
    while(tmp > 0) {
        tmp = Math.round((tmp - tmp % 10)/10);
        digitsCount ++;
    }
    tmp = Math.round(number);
    let cnt = 0;
    if(digitsCount > 6) {
        while (cnt !== 4) {
            tmp = Math.round((tmp - tmp % 10) / 10);
            cnt++;
        }
        tmp = tmp/100 + " mil";
    } else if(digitsCount > 3) {
        while (cnt !== 1) {
            tmp = Math.round((tmp - tmp % 10) / 10);
            cnt++;
        }
        tmp = tmp/100 + " K";
    }
    return tmp;
}

function makeQuickAccess(geo) {
    for(let i in geo["features"])
    {
        let countryCode = geo["features"][i]["properties"]["ISO_A3"];
        let countryName = geo["features"][i]["properties"]["ADMIN"];
        if(geo["features"][i]["covidInfo"] && geo["features"][i]["covidInfo"]["data"]) {
            let data = geo["features"][i]["covidInfo"]["data"];
            let dateData = {};
            for(let j in data) {
                dateData[data[j]["date"]] = data[j];
                dateData[data[j]["date"]]["id"] = j;
            }
            quickAccess[countryCode]={"name":countryName, "data":dateData};
        } else {
            quickAccess[countryCode] = {"name":countryName};
        }
    }
    globalCountryName = [];
    globalCountryColor = [];
    let cnt = 1;
    for(let i in quickAccess) {
        globalCountryName.push(quickAccess[i]["name"]);
        globalCountryColor.push(d3.interpolateSpectral(cnt/Object.keys(quickAccess).length));
        cnt += 1;
    }
}

function makeQuickCountryCode(geo) {
    for(let i in geo["features"]) {
        let countryCode = geo["features"][i]["properties"]["ISO_A3"];
        let countryName = geo["features"][i]["properties"]["ADMIN"];
        let countryName2 = null;
        if(geo["features"][i]["covidInfo"] && geo["features"][i]["covidInfo"]["location"])
            countryName2 = geo["features"][i]["covidInfo"]["location"];
        if(countryName2) {
            geo["features"][i]["properties"]["ADMIN"] = countryName2;
            countryName = countryName2;
        }
        getCountryCode[countryName2] = countryCode;
    }
}

function bindingData(geo, covidData) {
    for(let i in geo["features"])
    {
        let country = geo["features"][i];
        let ISOCode = country["properties"]["ISO_A3"]
        if(ISOCode === "-99")
        {
            let s = country["properties"]["ADMIN"];
            let code = "";
            for(let i = 0; i < s.length; ++i) {
                if(s.charAt(i) === s.charAt(i).toUpperCase() && s.charAt(i) !== " ") {
                    code += s.charAt(i);
                }
            }
            code += "_";
            geo["features"][i]["properties"]["ISO_A3"] = code;
        }
    }
    for (let key in covidData)
    {
        for(let i in geo["features"])
        {
            let country = geo["features"][i];
            let ISOCode = country["properties"]["ISO_A3"]
            if(ISOCode.toLowerCase() === key.toLowerCase())
            {
                geo["features"][i]["covidInfo"] = covidData[key];
                break;
            }
        }
    }
    return geo;
}

/**
 *
 * @param data
 * @param callback
 * @returns {number}
 */
function findGlobalMaxMinDate(data = null, callback = null) {
    if(data)
    {
        for(let i in data["features"]) {
            if(data["features"][i]["covidInfo"] && data["features"][i]["covidInfo"]["data"]) {
                for(let j in data["features"][i]["covidInfo"]["data"])
                {
                    let curDate = new Date(data["features"][i]["covidInfo"]["data"][j]["date"])
                    if(globalMinDate > curDate)
                        globalMinDate = new Date(curDate);
                    if(globalMaxDate < curDate)
                        globalMaxDate = new Date(curDate);
                }
            }
        }
        let date = null;
        for(date = new Date(globalMinDate); date < globalMaxDate; date.setDate(date.getDate() + 10)) {
            dateIter += 1;
        }
        if(date > globalMaxDate)
            dateIter -= 1;
    }
    if(callback)
        callback();
    return 0;
}

function formatDate(d) {
    let month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();
    if (month.length < 2)
        month = '0' + month;
    if (day.length < 2)
        day = '0' + day;
    return [year, month, day].join('-');
}

// to make each date has the same set of attributes.
function getAllCat(geo) {
    cat = {};
    for(let i in geo["features"]) {
        if(geo["features"][i]["covidInfo"] && geo["features"][i]["covidInfo"]["data"]) {
            for(let j in geo["features"][i]["covidInfo"]["data"]) {
                for(let key in geo["features"][i]["covidInfo"]["data"][j])
                {
                    let reKey = key.replaceAll(" ", "_")
                    if(!cat[reKey])
                        cat[reKey] = geo["features"][i]["covidInfo"]["data"][j][key];
                    else
                        cat[reKey] = Math.max(cat[reKey], geo["features"][i]["covidInfo"]["data"][j][key]);
                }
            }
        }
    }
    delete cat["tests_units"];
    delete cat["id"];
    delete cat["date"];
    cat = Object.keys(cat).sort().reduce(
        (obj, key) => {
            obj[key] = cat[key];
            return obj;
        },
        {}
    );
    return cat;
}

/*
Mod the quick access json for plotting purposes
 */
function modifiedQuickAccess(quickAccess) {
    // fill all values;
    for(let countryCode in quickAccess)
    {
        if(quickAccess[countryCode]["data"])
        {
            for(let prevDate = null, date = new Date(globalMinDate); date < globalMaxDate;
                preDate = new Date(date), date.setDate(date.getDate() + 1))
            {
                let readableDate = formatDate(date);
                let readblerevDate = !prevDate ? null : formatDate(prevDate);
                if(!quickAccess[countryCode]["data"][readableDate])
                    quickAccess[countryCode]["data"][readableDate] = {};
                for(let key in globalCat) {
                    if(!quickAccess[countryCode]["data"][readableDate][key])
                        if(readblerevDate)
                            quickAccess[countryCode]["data"][readableDate][key] = quickAccess[countryCode]["data"][readblerevDate][key];
                        else
                            quickAccess[countryCode]["data"][readableDate][key] = 0;
                }
            }
        }
    }
    return quickAccess;
}



function getCirclePlotData(quickAccess, date, countrySet = null)
{
    let res = [];
    globalCountryColor = [];
    if(countrySet !== null)
    {
        date = formatDate(new Date(date));
        for(let i in quickAccess) {
            if (quickAccess[i]["data"] && quickAccess[i]["data"][date])
            {
                countryName = quickAccess[i]["name"];
                if(countrySet[countryName] === 0)
                    continue;
                obj = {};
                obj["country"] = countryName;
                for(key in quickAccess[i]["data"][date])
                {
                    obj[key] = quickAccess[i]["data"][date][key];
                }
                res.push(obj);
            }
        }
    } else
    {
        date = formatDate(new Date(date));
        for(let i in quickAccess) {
            if (quickAccess[i]["data"] && quickAccess[i]["data"][date])
            {
                countryName = quickAccess[i]["name"];
                obj = {};
                obj["country"] = countryName;
                for(key in quickAccess[i]["data"][date])
                {
                    obj[key] = quickAccess[i]["data"][date][key];
                }
                res.push(obj);
            }
        }
    }
    globalCountryName = [];
    let cnt = 1;
    for(let i in res) {
        globalCountryName.push(res[i]["name"]);
        globalCountryColor.push(d3.interpolateSpectral(cnt/Object.keys(res).length));
        cnt += 1;
    }

    return res;
}

function getAllCountry()
{
    for(let key in modQuickAccess) {
        globalCountrySet[modQuickAccess[key]["name"]] = 0;
    }
}