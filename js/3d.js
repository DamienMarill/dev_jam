//
// Configuration
//

// ms to wait after dragging before auto-rotating
var rotationDelay = 3000
// scale of the globe (not the canvas element)
var scaleFactor = 0.85
// autorotation speed
var degPerSec = 6
// start angles
var angles = { x: -20, y: 40, z: 0}
// colors
var colorWater = 'rgb(3,169,244)'
var colorLand = 'rgb(144,164,174)'
var colorGraticule = 'rgb(2,119,189)'
var nonData = 'rgb(97,97,97)'

var polygonWeight = 1;
var polygonOpacity = 0.65;

var paysLayer = new Object();
var paysForet = new Object();
var paysInfos = new Object();
var paysColor = new Object();

var rangeYear = document.getElementById('rangeYear');

rangeYear.setAttribute("min", yearMin);
rangeYear.setAttribute("max", yearMax);

rangeYear.oninput = function(){
    if (currentCountry) {
        code = whereNumeric(currentCountry.id);
        genpopup(code.alpha2, rangeYear.value);
    }else if(oldCountry){
        code = whereNumeric(oldCountry.id);
        genpopup(code.alpha2, rangeYear.value);
    }
    update3Dmap();
}

//
// Handler
//

function enter(country) {
    var country = countryList.find(function(c) {
        var code = whereAlpha2(c.alpha2Code);
        if(typeof code !== 'undefined'){
            code = code.numeric;
        }
        return code === country.id
    })
    current.text(country && country.translations.fr || '')
}

function leave(country) {
    current.text('')
}

//
// Variables
//

var current = d3.select('#current')
var canvas = d3.select('#globe')
var context = canvas.node().getContext('2d')
var water = {type: 'Sphere'}
var projection = d3.geoOrthographic().precision(0.1)
var graticule = d3.geoGraticule10()
var path = d3.geoPath(projection).context(context)
var v0 // Mouse position in Cartesian coordinates at start of drag gesture.
var r0 // Projection rotation as Euler angles at start.
var q0 // Projection rotation as versor at start.
var lastTime = d3.now()
var degPerMs = degPerSec / 1000
var width, height
var land, countries
var countryList
var autorotate, now, diff, roation
var currentCountry
var draggedCpt =0;
var mouseMoveCpt =0;
var isRotate = true;
var oldCountry;
//
// Functions
//

function setAngles() {
    var rotation = projection.rotate()
    rotation[0] = angles.y
    rotation[1] = angles.x
    rotation[2] = angles.z
    projection.rotate(rotation)
}

function scale() {
    width = document.documentElement.clientWidth
    height = document.documentElement.clientHeight
    canvas.attr('width', width).attr('height', height)
    projection
        .scale((scaleFactor * Math.min(width, height)) / 2)
        .translate([width / 2, height / 2])
    render()
}

function startRotation(delay) {
    autorotate.restart(rotate, delay || 0)
    setTimeout(function () {
        isRotate = true;
    }, delay);
}

function stopRotation() {
    autorotate.stop()
    isRotate = false;
}

function dragstarted() {
    v0 = versor.cartesian(projection.invert(d3.mouse(this)))
    r0 = projection.rotate()
    q0 = versor(r0)
    stopRotation()
}

function dragged() {
    var v1 = versor.cartesian(projection.rotate(r0).invert(d3.mouse(this)))
    var q1 = versor.multiply(q0, versor.delta(v0, v1))
    var r1 = versor.rotation(q1)
    projection.rotate(r1)
    if(draggedCpt == 3){
        render();
        draggedCpt = 0;
    }else{
        draggedCpt++;
    }

}

function dragended() {
    startRotation(rotationDelay)
}

function render() {
    context.clearRect(0, 0, width, height)
    fill(water, colorWater)
    stroke(graticule, colorGraticule)
    for (var i=0; i<countries.features.length; i++){
        fill(countries.features[i], paysColor[i]);
    }
    stroke(countries, colorLand, 2);
    if (currentCountry) {
        var code = whereNumeric(currentCountry.id);
        if(typeof code !== 'undefined' && typeof paysForet[code.alpha2] !== 'undefined'){
            var color = forestPercentColor(paysForet[code.alpha2][rangeYear.value]);
            if(color == 'rgb(NaN,NaN,NaN)'){
                color = nonData;
            }
        }else{
            var color = nonData;
        }
        fill(currentCountry, color, 1)
    }
}

function fill(obj, color, opacity = 0.9) {
    context.beginPath()
    path(obj)
    context.fillStyle = color
    context.globalAlpha = opacity;
    context.fill()
}

function stroke(obj, color, width = 1) {
    context.beginPath()
    path(obj)
    context.strokeStyle = color
    context.lineWidth = width;
    context.stroke()
}

function rotate(elapsed) {
    now = d3.now()
    diff = now - lastTime
    if (diff < elapsed) {
        rotation = projection.rotate()
        rotation[0] += diff * degPerMs
        projection.rotate(rotation)
        render()
    }
    lastTime = now
}

function loadData(cb) {
    d3.csv("../data/taux_forets.csv", function (error, dataForetBrut) {
        if (error) throw  error
        d3.json('../data/contours_pays_3d.json', function(error, world) {
            if (error) throw error
            d3.json('https://restcountries.eu/rest/v2/all', function(error, countries) {
                if (error) throw error
                cb(world, countries, dataForetBrut)
            })
        })
    })
}

// https://github.com/d3/d3-polygon
function polygonContains(polygon, point) {
    var n = polygon.length
    var p = polygon[n - 1]
    var x = point[0], y = point[1]
    var x0 = p[0], y0 = p[1]
    var x1, y1
    var inside = false
    for (var i = 0; i < n; ++i) {
        p = polygon[i], x1 = p[0], y1 = p[1]
        if (((y1 > y) !== (y0 > y)) && (x < (x0 - x1) * (y - y1) / (y0 - y1) + x1)) inside = !inside
        x0 = x1, y0 = y1
    }
    return inside
}

function mousemove() {

    var event = window.event;
    var h2 = document.getElementById('current').style;

    x = event.clientX+15;
    x = x+"px";
    y = "calc("+event.clientY+"px - 0.5rem)";
    h2.transform = "translate("+x+","+y+")";
    if(mouseMoveCpt == 3){
        var c = getCountry(this)
        if (!c) {
            if (currentCountry) {
                leave(currentCountry)
                currentCountry = undefined;
                render();
            }
            return
        }
        if (c === currentCountry) {
            return
        }
        currentCountry = c
        if(!isRotate){
            render();
        }
        enter(c)
        mouseMoveCpt = 0;
    }else{
        mouseMoveCpt++;
    }
}

function getCountry(event) {
    var pos = projection.invert(d3.mouse(event))
    return countries.features.find(function(f) {
        return f.geometry.coordinates.find(function(c1) {
            return polygonContains(c1, pos) || c1.find(function(c2) {
                return polygonContains(c2, pos)
            })
        })
    })
}


//
// Initialization
//

setAngles()

canvas
    .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended)
    )
    .on('mousemove', mousemove)
    .on('click', ficheInfos)

loadData(function(world, cList, dataForetBrut) {
    land = topojson.feature(world, world.objects.land)
    countries = topojson.feature(world, world.objects.countries)
    countryList = cList
    for (var i in countryList){
        paysInfos[countryList[i].alpha2Code] = countryList[i];
    }
    console.log(paysInfos);

    for(var i=0; i<dataForetBrut.length; i++){
        var code = whereAlpha3(dataForetBrut[i].countryCode);
        if(typeof code !== 'undefined'){
            paysForet[code.alpha2] = new Object();
            for(var m= yearMin; m<=yearMax; m++){
                paysForet[code.alpha2][m] = dataForetBrut[i][m];
            }
        }
    }
    console.log(paysForet);

    window.addEventListener('resize', scale)
    scale()
    autorotate = d3.timer(rotate)
    update3Dmap()
})

function updColor() {
    for (var i=0; i<countries.features.length; i++){
        var code = whereNumeric(countries.features[i].id);
        if(typeof code !== 'undefined' && typeof paysForet[code.alpha2] !== 'undefined'){
            var color = forestPercentColor(paysForet[code.alpha2][rangeYear.value]);
            if(color == 'rgb(NaN,NaN,NaN)'){
                color = nonData;
            }
        }else{
            var color = nonData;
        }
        paysColor[i] = color;
    }
}

function update3Dmap() {
    document.getElementById('yearAffiche').innerHTML = rangeYear.value;
    updColor();
    if(!isRotate){
        render();
    }
}

function ficheInfos() {
    if (currentCountry) {
        oldCountry = currentCountry;
        d3.select("#popup").style("opacity", 1);
        code = whereNumeric(currentCountry.id);
        genpopup(code.alpha2, rangeYear.value);
    }else{
        d3.select("#popup").style("opacity", 0);
    }
}

function genpopup(CountryCode, year) {
    var pays = paysInfos[CountryCode];
    if(typeof paysForet[CountryCode] === 'undefined'){
        paysForet[CountryCode] = new Object();
        for(var m= yearMin; m<=yearMax; m++){
            paysForet[CountryCode][m] = "";
        }
    }
    var percent = parseInt(paysForet[CountryCode][year.toString()]);

    if(isNaN(percent)){
        var txtForet = "<p>Pas de données pour "+year+"</p>";
    }else{
        var txtForet = "<p>"+percent+"% de forêts en "+year+"</p>";
    }

    if(typeof lstCompar[CountryCode] === 'undefined'){
        var couleurCompar = "btn-outline-success";
        var iconCompar = 'fa-plus';
    }else{
        var couleurCompar = "btn-outline-danger";
        var iconCompar = 'fa-minus';
    }

    d3.select('.miniFlag').attr("src", pays.flag);
    d3.select('#nomPaysFr').html(pays.translations.fr);
    d3.select('#popupPourcent').html(txtForet);
    d3.select('#popupInfoButton').attr("onclick", "updateModal('"+CountryCode+"')");
    d3.select('#popupComparButton').select('button').attr("class", "btn "+couleurCompar+" mt-2");
    d3.select('#popupComparButton').select('button').attr("id", "btnCompar_"+CountryCode);
    d3.select('#popupComparButton').select('button').attr("onclick", "toggleCompar('"+CountryCode+"')");
    d3.select('#popupComparButton').select('span').attr("class", "fas "+iconCompar);
}

function toggleCompar(countryCode){
    if(typeof lstCompar[countryCode] !== 'undefined'){
        //supprimer de la comparaison
        delete lstCompar[countryCode];
        document.getElementById('compar_'+countryCode).remove();
        cptcompar--;
        if(cptcompar == 0){
            document.getElementById('blockCompraison').style.display = "none";
        }
    }else{
        //ajout à la comparaison
        lstCompar[countryCode] = "";
        document.getElementById('lstCompar').innerHTML+= '<div class="text-center my-2" id="compar_'+countryCode+'"><button class="btn btn-danger w-75 fas fa-trash-alt supprComparbtn" onclick="toggleCompar(\''+countryCode+'\')"></button><P><span>'+countryCode+'</span> <img class="comparFlag" src="'+paysInfos[countryCode].flag+'"></P></div>';
        cptcompar++;
        document.getElementById('blockCompraison').style.display = "block";
    }
    genpopup(countryCode, rangeYear.value);
}
