

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
    let timelength = document.getElementById("timeSelector").value;
    let timetext = document.getElementById("timeSelector")[document.getElementById("timeSelector").options.selectedIndex].innerText;
    for (let i = 0; i < result.data.time.length; i++) {
        if (result.data.time[i - 1] && (result.data.time[i] - result.data.time[i - 1]) > 120000) {
            //console.log("we may want to play a null here");
            data[0].push([result.data.time[i], null]);
            data[1].push([result.data.time[i], null]);
            data[2].push([result.data.time[i], null]);
        }
        data[0].push([result.data.time[i], result.data.total[i]]);
        data[1].push([result.data.time[i], result.data.active[i]]);
        data[2].push([result.data.time[i], result.data.active[i] / result.data.total[i] * 100]);
    }
    while (data[0][data[0].length - 1][0] - data[0][0][0] > timelength) {
        console.log(`Shifting due to length over ${timetext}`);
        data[0].shift(); data[1].shift(); data[2].shift();

    }
    data[0].unshift([Date.now() - timelength, null]); // we want to force show the period of time we want to display
    data[0].push([Date.now(), null]);
    data[3] = result.guild;
    return data;
};
let data = async () => {
    let data = parseData(await getData(document.getElementById("serverSelector").value));
    //console.log(data);
    chart = Highcharts.chart('container', {

        chart: {
            zoomType: 'x'
        },

        title: {
            text: data[3].name,
        },

        subtitle: {
            text: data[3].id,
        },

        tooltip: {
            shared: true
        },

        xAxis: {
            type: 'datetime',
            crosshair: true
        },

        yAxis: [{ // Primary yAxis
            title: {
                text: 'People',
            },
            min: 0,


        }, { // Secondary yAxis
            gridLineWidth: 0,
            title: {
                text: 'Percentage',
            },
            labels: {
                format: '{value} %',
            },
            opposite: true,
            max: 100,
            min: 0,

        }],

        series: [{
            data: data[0],
            lineWidth: 0.5,
            name: 'Total'
        }, {
            data: data[1],
            lineWidth: 0.5,
            name: 'Active',
        }, {
            data: data[2],
            lineWidth: 0.5,
            name: 'Percentage',
            yAxis: 1,
            tooltip: {
                valueSuffix: ' %',
                valueDecimals: 2,
            }
        }]

    });
};
setInterval(data(), 120000);
            //console.log(data);
