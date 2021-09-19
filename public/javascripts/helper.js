

// we want to run this as soon as we load and then after every 2 minutes
var updateSelector = async () => {
    let response = await fetch("/api/getserverids");
    try {
        let serverids = (await response.json());
        let selector = document.getElementById('serverSelector');
        let currOptions = [], currValue;
        for (let i = 0; i < selector.options.length; i++) // loop through currently shown options and add them to an array
            currOptions.push(selector.options[i].value);
        //console.log(currOptions);
        try { // we do this to 
            currValue = selector.selectedOptions[0].value; // get the current value of the select
        } catch {
            //console.log("We have no selected options currently, which means we dont have options in select")
        }
        selector.innerHTML = '<option value="" disabled="true" selected="true">Select the server to look at</option>'; // remove all innerhtml (options)
        for (let i = 0; i < serverids.length; i++) { // set innerhtml so that it has the updated server ids
            selector.innerHTML += `<option value="${serverids[i].id}">${serverids[i].name}</option>`;
        }
        for (var i = 0; i < selector.options.length; ++i) {
            if (selector.options[i].value === currValue) selector.options[i].selected = true;
        }
        return null;
    } catch {
        return null;
    }
};

var getData = async (id) => {
    if (id) {
        let response = await fetch("/api/getdata/" + id);
        try {
            return await response.json();
        } catch {
            return response;
        }
    } else {
        return (console.log("getData does not have a arg..."));
    }
};

var parseData = function (result) {
    let data = [[], [], [], []];
    for (let i = 0; i < result.data.time.length; i++) {
        if (result.data.time[i - 1] && (result.data.time[i] - result.data.time[i - 1]) > 120000) {
            console.log("we may want to play a null here");
            data[0].push([result.data.time[i], null]);
            data[1].push([result.data.time[i], null]);
            data[2].push([result.data.time[i], null]);
        }
        data[0].push([result.data.time[i], result.data.total[i]]);
        data[1].push([result.data.time[i], result.data.active[i]]);
        data[2].push([result.data.time[i], result.data.active[i] / result.data.total[i] * 100]);
    }
    //data[0].unshift([Date.now() - timelength, null]); // we want to force show the period of time we want to display
    //data[0].push([Date.now(), null]);
    data[3] = result.guild;
    return data;
};
let data = async () => {
    let data = parseData(await getData(document.getElementById("serverSelector").value));
    //console.log(data);
    Highcharts.stockChart('container', {
        chart: {
            plotBackgroundColor: 'hsl(200,4%,98%)'
        },
        credits: {
            text: "hwidspoofer.com",
            href: "https://hwidspoofer.com"
        },
        scrollbar: {
            enabled : false
        },
        exporting:{
            buttons:{
                contextButton:{
                    x: 5,
                    y: -5,
                }
            },
            printMaxWidth: 1560, // default times 2
            sourceWidth: 1200,
        },

        rangeSelector: {
            selected: 1,  
            buttons: [{
                type: 'day',
                text: '1d',
                title: 'View 1 day'
            }, {
                type: 'day',
                count: 2,
                text: '2d',
                title: 'View 2 day'
            }, {
                type: 'week',
                text: '1w',
                title: 'View 1 week'
            }, {
                type: 'month',
                text: '1m',
                title: 'View 1 month'
            },{
                type: 'month',
                count: 3,
                text: '3m',
                title: 'View 3 month'
            }, {
                type: 'all',
                text: 'All',
                title: 'View all'
            }],
            height:30,
            //floating:true,

        },
        legend: {
            enabled: true,
            align: 'left',
            layout: 'proximate',
            //verticalAlign: 'top',
            margin:-90,
            padding:0,
            symbolWidth: 0,
            y: 12,
            itemStyle: {
                fontWeight: "normal",
                color: '#666666',
                opacity: "50%",
            }
        },

        title: {
            text: data[3].name,
            floating:false,
            //y:45,
            margin:-30,
        },

        subtitle: {
            text: data[3].id,
            floating:true,
            y:25

        },

        tooltip: {
            shared: true
        },

        colors: [
            ' rgba(236, 76, 145,0.99)','rgba(0, 160, 175,0.99)','rgba(255, 159, 152,0.99)', //'hsla(280,100%,80%,100%)','hsla(200,100%,80%,100%)',"hsla(240,100%,80%,100%)",
        ],

        xAxis: {
            type: 'datetime',
            crosshair: true
        },

        yAxis: [{ // Primary yAxis
            title: {
                text: 'People',
                margin: 5,
            },
            min: 0,
            tickAmount:5,
            labels:{
                style: {
                    opacity:"50%"
                }
            }
            
        }, { // Secondary yAxis
            gridLineWidth: 2,
            max: 100,
            min: 0,
            tickAmount:5,
            alignTicks: true,
            opposite: false,
            labels: {
                format: '{value}%',
                align: 'center',
                x:30,
                style: {
                    opacity:"50%"
                }
            },
            title: {
                reserveSpace: false,
            }

        }],
        plotOptions: {
            series: {
                showInNavigator: true,
                lineWidth: 1,
                connectNulls: false,
                gapSize: 2,
                opacity: 2,
                showInLegend: true,
            }
        },

        series: [{
            data: data[0],
            name: 'Total',
            
        },{
            data: data[2],
            name: 'Percentage',
            yAxis: 1,
            tooltip: {
                valueSuffix: ' %',
                valueDecimals: 2,
            }
        }, {
            data: data[1],
            name: 'Active',
        }, ]

    });
    data = null; // we dont need to store this as the chart will make a copy
};
