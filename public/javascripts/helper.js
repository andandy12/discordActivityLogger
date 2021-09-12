// we want to run this as soon as we load and then after every 2 minutes
var updateSelector = async() => {
    let response = await fetch("/api/getserverids");
    try{
        let serverids = (await response.json());
        let selector = document.querySelector('#id-select-server');
        let currOptions = [],currValue;
        for(let i =0;i<selector.options.length;i++) // loop through currently shown options and add them to an array
            currOptions.push(selector.options[i].value);
        //console.log(currOptions);
        try{ // we do this to 
        currValue = selector.selectedOptions[0].getAttribute("name"); // get the current value of the select
        }catch{
            //console.log("We have no selected options currently, which means we dont have options in select")
        }
        selector.innerHTML ='<option value="" disabled="true" selected="true">Select the server to look at</option>'; // remove all innerhtml (options)
        for(let i =0;i<serverids.length;i++){ // set innerhtml so that it has the updated server ids
            selector.innerHTML += `<option name="${serverids[i].id}">${serverids[i].name}</option>`;
        }
        for (var i = 0; i < selector.options.length; ++i) {
            if (selector.options[i].getAttribute("name") === currValue) selector.options[i].selected = true;
        }
        return null;
    }catch{
        return null;
    }
}



var chart; // we want this to be a global so that it can be accessed from anywhere for use in update function

var initChart = async (id) =>{
    if(document.querySelector('#id-select-server').selectedOptions[0].getAttribute("name"))
        id = document.querySelector('#id-select-server').selectedOptions[0].getAttribute("name");
    if(chart && chart.id == id)
        return console.error("The chart is currently using that id... cant reinitalize it.");
    let data = await getData(id);
    if(data.status == 404){
        console.error("There is no data for that server id... check if server id is valid");
        return alert("There is no data for that server id... check if server id is valid");
    }
    if(!chart)
        console.log("Update Interval: " + setInterval(()=>{
            updateChart();
        },60000));
    return setupChart(parseData(data));
}

var updateChart = async () => {
    if(!chart)
        return console.error("You must run initChart() successfully before updating it");
    let id = document.querySelector('#id-select-server').selectedOptions[0].getAttribute("name");
    let timeselection = chart.getTimeSelection()
    chart.setChartData(createDataStore(parseData(await getData(id))));
    return chart.setTimeSelection(timeselection);
}

var getData = async (id) => {
    let response = await fetch("/api/getdata/" + id);
    try{
        return await response.json();
    }catch{
        return response;
    }
} 

var parseData = function (result) {
    let data = {
        "values": [result.data.total, result.data.active, [], result.data.time],
        "title": `${result.guild.name} - ${result.guild.id}`,
    };
    result.data.total.forEach((e, i) => { data.values[2][i] = result.data.active[i] / result.data.total[i] * 100 });
    return data;
}

var createDataStore = function(retdata){
    let data = [];
    retdata.values[0].forEach((e, i) => {
        data.push([retdata.values[3][i], retdata.values[0][i], retdata.values[1][i], retdata.values[2][i]])
    })
    let schema = [{
        "name": "Time",
        "type": "date",
        "format": "%Q"
    }, {
        "name": "Total",
        "type": "number"
    }, {
        "name": "Active",
        "type": "number"
    }, {
        "name": "Percentage",
        "type": "number"
    }];
    var dataStore = new FusionCharts.DataStore();
    return myds = {
        chart: {
            theme: "candy",
            exportEnabled: "1",
            canvasHeightProportion: '3:1',
            multicanvas: false,
        },
        navigator: {
            "enabled": "0",
        },
        "extensions": {
            "customRangeSelector": {
                "enabled": "0"
            }
        },
        caption: {
            text: "Server Report"
        },
        subCaption: {
            text: retdata.title
        },
        yAxis: [
            {
                plot: [
                    {
                        value: "Percentage",
                        type: "line",
                    }
                ],
                min: "0",
                max: "100",
                connectNullData: "false",
                Title: "Percentage Active",
                showGridband: "1",
                style: {
                    "grid-band": {
                        fill: "#fafafa"
                    }
                },
                format: {
                    suffix: "%"
                },

            },{
                plot: [
                    {
                        value: "Total",
                        type: "line"
                    },
                    {
                        value: "Active",
                        type: "line"
                    }
                ],
                min: "0",
                connectNullData: "false",
                showGridband: "1",
                style: {
                    "grid-band": {
                        fill: "#fafafa"
                    }
                },
            },
        ],
        data: dataStore.createDataTable(data, schema)
    };
}

var setupChart = function (data) {
    myds = createDataStore(data);
    try{
        FusionCharts(document.querySelector('#id-select-server').selectedOptions[0].getAttribute("name")).dispose();
    }catch{
        console.log("We attempted to dispose of a chart but it didnt exist...");
    }
    return chart = new FusionCharts({
        type: "timeseries",
        renderAt: "chart-container",
        id: data.title.split(" - ")[1],
        width: "100%",
        height: "100%",
        dataSource: myds
    }).render();
}