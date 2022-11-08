var yearMin = 1990;
var yearMax = 2016;

var maxForet = 100;
var minForet = 0;

var bestColor = [76,175,80];
var badColor = [191,54,12];
var noDatacolor = "rgb(144,164,174)";

var lstCompar = new Object();
var colorChartCompar = [
    'rgb(244,67,54)',
    'rgb(233,30,99)',
    'rgb(156,39,176)',
    'rgb(103,58,183)',
    'rgb(63,81,181)',
    'rgb(33,150,243)',
    'rgb(3,169,244)',
    'rgb(0,188,212)',
    'rgb(0,150,136)',
    'rgb(76,175,80)',
    'rgb(139,195,74)',
    'rgb(205,220,57)',
    'rgb(255,235,59)',
    'rgb(255,193,7)',
    'rgb(255,152,0)',
    'rgb(255,87,34)',
    'rgb(121,85,72)'
];

function forestPercentColor(percent) {
    percent = parseInt(percent);
    percent = percent / 100;
    var good = [];
    var bad = [];
    var colorTable = [];
    for (var i = 0; i<3; i++){
        good[i] = bestColor[i]*percent;
        bad[i] = badColor[i]*(1-percent);
        colorTable[i] = Math.floor(good[i]+bad[i]);
    }
    var color = "rgb("+colorTable[0]+","+colorTable[1]+","+colorTable[2]+")";
    return color;
}

function updateModal(CountryCode) {
    pays = paysInfos[CountryCode];

    document.getElementById('infoFlag').setAttribute('src', pays.flag);
    document.getElementById('infoNom').innerHTML = pays.translations.fr;
    document.getElementById('infoContinent').innerHTML = pays.region;
    document.getElementById('infoCapitale').innerHTML = pays.capital;
    document.getElementById('infoPopulation').innerHTML = pays.population.toLocaleString('fr-FR');
    document.getElementById('infoSuperficie').innerHTML = pays.area.toLocaleString('fr-FR');

    var iconContinent = document.getElementById('infoConIcon').classList;
    iconContinent.remove('fa-globe-europe');
    iconContinent.remove('fa-globe-asia');
    iconContinent.remove('fa-globe-americas');
    iconContinent.remove('fa-globe-africa');

    switch (pays.region) {
        case 'Europe':
            iconContinent.add('fa-globe-europe');
        case 'Asia':
            iconContinent.add('fa-globe-asia');
        case 'Oceania':
            iconContinent.add('fa-globe-asia');
        case 'Americas':
            iconContinent.add('fa-globe-americas');
        case 'Africa':
            iconContinent.add('fa-globe-africa');
        default :
            iconContinent.add('fa-globe-europe');
    }

    var langue = "";
    for(var i=0; i<pays.languages.length && i<3; i++){
        if(i>0){
            first = ", ";
        }else{
            first = "";
        }
        langue += first+pays.languages[i].nativeName;
    }
    document.getElementById('infoLangues').innerHTML = langue;

    var dataForet = paysForet[CountryCode];
    var dataChart = [];
    for (var i = yearMin; i <= yearMax; i++){
        dataChart.push({
            t: new Date(i.toString()),
            y: parseInt(dataForet[i]),
        });
    }
    foretChart.data.datasets[0].data = dataChart;
    foretChart.options.title.text = "Surface forestière "+pays.translations.fr;
    foretChart.update();

    var Ystart = yearMin;
    var Yend = yearMax;
    while(dataForet[Ystart] === ""){
        Ystart++;
    }
    while(dataForet[Yend] === ""){
        Yend--;
    }
    if(Ystart == yearMax+1){
        document.getElementById('evoForet').classList.add('d-none');
        document.getElementById('evoError').classList.remove('d-none');
    }else{
        document.getElementById('evoForet').classList.remove('d-none');
        document.getElementById('evoError').classList.add('d-none');

        var evolution = parseInt(parseFloat(dataForet[Yend])-parseFloat(dataForet[Ystart]));
        if(evolution < 0){
            document.getElementById('evoForet').style.color = 'var(--negatif)';
        }else if(evolution > 0){
            document.getElementById('evoForet').style.color = 'var(--positif)';
            evolution = "+"+evolution;
        }else{
            document.getElementById('evoForet').style.color = 'var(--stable)';
            evolution = "+"+evolution;
        }
        document.getElementById('evoForetTxt').innerHTML = evolution;
        document.getElementById( 'evoForetMin').innerHTML = Ystart;
        document.getElementById( 'evoForetMax').innerHTML = Yend;
    }
}

var ctx = document.getElementById('forestChart').getContext('2d');
var foretChart = new Chart(ctx, {
    type: 'line',
    data: {
        datasets: [{
            label: '% de la surface du pays',
            backgroundColor: 'rgb(23, 162, 184)',
            borderColor: 'rgb(23, 162, 184)',
            fill: false,
            data: [{
                t: new Date('1990'),
                y: 42,
            },{
                t: new Date('2000'),
                y: 32,
            },{
                t: new Date('2010'),
                y: 62,
            }]
        }]
    },
    options: {
        scales: {
            xAxes: [{
                type: 'time',
                time: {
                    unit: 'year',
                    tooltipFormat: 'YYYY',
                }
            }],
            yAxes:[{
                ticks:{
                    beginAtZero: true,
                    min: 0,
                    max: 100,
                }
            }]
        },
        title : {
            display: true,
            position: 'top',
            text : "Surface forestière",
        },
        legend : {
            position: 'bottom',
        },
        tooltips: {
            enabled: true,
            backgroundColor: "rgb(207,216,220)",
            titleFontColor: "rgb(33, 37, 41)",
            bodyFontColor: "rgb(33, 37, 41)",
        }
    }
});

var cptcompar = 0;

function updateModalCompar() {
    foretChartCompar.data.datasets = [];
    var compt = 0;
    for (const [key, value] of Object.entries(lstCompar)){
        var dataForet = paysForet[key];
        var color = colorChartCompar[compt%colorChartCompar.length];
        var dataChart = {
            label: paysInfos[key].translations.fr,
            backgroundColor: color,
            borderColor: color,
            fill: false,
            data: [],
        };
        for (var i = yearMin; i <= yearMax; i++){
            dataChart.data.push({
                t: new Date(i.toString()),
                y: parseInt(dataForet[i]),
            });
        }
        foretChartCompar.data.datasets.push(dataChart);
        compt++;
    }
    foretChartCompar.update();
}

var ctxCompar = document.getElementById('forestChartCompar').getContext('2d');
var foretChartCompar = new Chart(ctxCompar, {
    type: 'line',
    data: {
        datasets: [{
            label: '% de la surface du pays',
            backgroundColor: 'rgb(23, 162, 184)',
            borderColor: 'rgb(23, 162, 184)',
            fill: false,
            data: []
        }]
    },
    options: {
        scales: {
            xAxes: [{
                type: 'time',
                time: {
                    unit: 'year',
                    tooltipFormat: 'YYYY',
                }
            }],
            yAxes:[{
                ticks:{
                    beginAtZero: true,
                    min: 0,
                    max: 100,
                }
            }]
        },
        title : {
            display: true,
            position: 'top',
            text : "Surface forestière (%)",
        },
        legend : {
            position: 'bottom',
        },
        tooltips: {
            enabled: true,
            backgroundColor: "rgb(207,216,220)",
            titleFontColor: "rgb(33, 37, 41)",
            bodyFontColor: "rgb(33, 37, 41)",
        }
    }
});
