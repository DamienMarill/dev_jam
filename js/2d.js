var lat = 0,
    lon = 0; // Paris
var map = null;

var polygonWeight = 1;
var polygonOpacity = 0.65;

var paysLayer = new Object();
var paysForet = new Object();
var paysInfos = new Object();

var rangeYear = document.getElementById('rangeYear');

rangeYear.setAttribute("min", yearMin);
rangeYear.setAttribute("max", yearMax);

rangeYear.oninput = function(){
    update2Dmap(parseInt(rangeYear.value));
}

window.onload = init;

function init(){
    d3.csv("../data/taux_forets.csv").then( function (dataForet) {
        d3.json("../data/contours_pays.json").then( function (pathPays) {
            d3.json('../data/data_pays.json').then( function (dataPays) {
                var mbAttr = 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
                    '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
                    'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
                    mbUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

                var grayscale = L.tileLayer(mbUrl, {
                    id: 'mapbox.light',
                    attribution: mbAttr
                });

                map = L.map('map', {
                    center: [lat, lon],
                    zoom: 2,
                    layers: [grayscale]
                });

                var initStyle = {
                    "color": noDatacolor,
                    "weight": polygonWeight,
                    "opacity": polygonOpacity
                };

                npays = 0;
                var pathFeatures = pathPays['features'];
                for (var i = 0; i<pathFeatures.length; i++){
                    present = false;
                    for (var k=0; k<dataForet.length; k++){
                        var contryCode = whereAlpha3(dataForet[k].countryCode);
                        if(typeof contryCode !== 'undefined'){
                            contryCode = contryCode.alpha2;
                        }
                        for (var p=0; p<dataPays.length; p++){
                            if(contryCode == pathFeatures[i].id && contryCode == dataPays[p].alpha2Code){
                                present = true;
                                paysForet[contryCode] = new Object();
                                for(var m= yearMin; m<=yearMax; m++){
                                    paysForet[contryCode][m] = dataForet[k][m];
                                }
                                var path = [];
                                for (var j = 0; j<pathFeatures[i].geometry.coordinates.length; j++){
                                    var newObj = new Object();
                                    path.push(newObj);
                                    path[j].type = "Polygon";
                                    path[j].coordinates = pathFeatures[i].geometry.coordinates[j];
                                }
                                paysLayer[contryCode] = L.geoJson(path, {
                                    style: initStyle
                                }).addTo(map);
                                npays++;

                                paysInfos[contryCode] = dataPays[p];

                                paysLayer[contryCode].bindPopup(genpopup(contryCode, rangeYear.value));

                                break;
                            }
                        }
                    }
                }

                update2Dmap(rangeYear.value);

                console.log(paysForet);
                console.log(paysLayer);
                console.log(paysInfos);
            });
        });
    });
}

function update2Dmap(year) {
    document.getElementById('yearAffiche').innerHTML = rangeYear.value;
    for (const [pays, data] of Object.entries(paysLayer)){
        var pourcent = paysForet[pays][year.toString()];
        paysLayer[pays].getPopup().setContent(genpopup(pays, year));
        var color = forestPercentColor(pourcent);
        data.setStyle({
            "color": color,
            "weight": polygonWeight,
            "opacity": polygonOpacity
        });
    }
}



function genpopup(CountryCode, year) {
    var pays = paysInfos[CountryCode];
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

    content = "<h4><img class='miniFlag' src='"+pays.flag+"'/><span>"+pays.translations.fr+"</span></h4>";
    content += txtForet;
    content += "<button type=\"button\" class=\"btn btn-info\" data-toggle=\"modal\" data-target=\".modalPays\" onclick='updateModal(\""+CountryCode+"\")'><i class=\"fas fa-info-circle\"></i> Infos</button>";
    content += "<button type=\"button\" class=\"btn "+couleurCompar+" mt-2\" id=\"btnCompar_"+CountryCode+"\" onclick='toggleCompar(\""+CountryCode+"\")'><span class='fas "+iconCompar+"'></span> comparer</button>"

    return content;
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
    paysLayer[countryCode].getPopup().setContent(genpopup(countryCode, rangeYear.value));
}
