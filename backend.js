const url = 'localhost:27017/myproject'; // Connection URL
const db = require('monk')(url);
const colors = {
    nc: "\033[0;36m", // cyan color
    rc: "\033[0m", // reset color
    lr: "\033[1;31m",// lightred
}


const collection = db.get('serverData');


console.log(`(node:${process.pid}) Watching ${"\033[1;49;32m" + "hwidspoofer" + colors.rc}`);
var invites = [{ invite: 'hwidspoofer', time: null }];

process.on('message', (msg) => {
    if (msg.invite && msg.time) {
        let previousIndex = invites.findIndex((e, i, arr) => { if (arr[i].invite === msg.invite) { return 1 } }); // get index of invite, returns -1 if not
        let newTime = Date.now() + parseInt(msg.time);
        if (previousIndex != -1) { // check if invite is already being watched
            if (invites[previousIndex].time < newTime) { // check if the requested length is shorter than the current length
                console.log(`(node:${process.pid}) Updating endtime on ${colors.nc + msg.invite + colors.rc} to ${newTime} due to a new request`);
                invites[previousIndex].time = newTime;
            } else {
                console.log(`(node:${process.pid}) Request to watch ${msg.invite} but it already is being watched through that time`);
            }
        } else { // if invite is not already being watched push it to the invite array
            console.log(`(node:${process.pid}) Watching ${"\033[1;49;32m" + msg.invite + colors.rc} for ${msg.time} milliseconds`);
            invites.push({ invite: msg.invite, time: newTime });
        }
    }
})


const request = require('request');
const jar = request.jar();

var collectData = function (url) {
    let options = {
        method: 'GET',
        url: 'https://discord.com/api/v9/invites/' + url,
        qs: { with_counts: 'true' },
        jar: 'JAR'
    };
    request(options, function (error, response, body) {
        if (error)
            throw new Error(error);
        body = JSON.parse(body);
        try {
            let data = { "guild": { "name": body.guild.name, "id": body.guild.id, "description": body.guild.description, "verification_level": body.guild.verification_level }, "data": { "total": [body.approximate_member_count], "active": [body.approximate_presence_count], "time": [Date.now()] } };
            collection.find({ "guild.id": body.guild.id.toString() }, function (err, result) {
                if (result.length != 0) { // check if we currently have the invite in the db
                    console.log(`(node:${process.pid}) Updating db info: ${colors.nc + body.guild.name + colors.rc}(${body.guild.id})`);
                    collection.findOneAndUpdate({ "guild.id": body.guild.id.toString() }, { $push: { "data.total": data.data.total[0], "data.active": data.data.active[0], "data.time": data.data.time[0] } })
                } else {
                    collection.insert(data, function (err, result) {
                        console.log(`(node:${process.pid}) Inserting into db: ${colors.nc + body.guild.name + colors.rc}(${body.guild.id})`);
                        console.log(result);
                    });
                }
            });
        } catch { // if we hit here the invite is bad and we want to remove it from the list
            console.log(`(node:${process.pid}) Invite ${colors.lr + url + colors.rc} is bad removing it from list early`);
            invites.splice(invites.findIndex((e, i, arr) => { if (arr[i].invite === url) { return 1 } }), 1);
        }
    });
}
setInterval(function () {
    //console.log(invites)//debug 
    for (let i = 0; i < invites.length; i++) {
        let currinvite = invites[i].invite;

        if (invites[i].time < Date.now() && invites[i].time != null) { // we dont continue as we want to guarantee atleast one captrue
            console.log(`(node:${process.pid}) Invite ${colors.lr + currinvite + colors.rc} is removed as time ran out`);
            invites.splice(i, 1);
        }
        try {
            collectData(currinvite);
        } catch {
            console.log(currinvite + " has failed");
        }
    }
}, 60000);