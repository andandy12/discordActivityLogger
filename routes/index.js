var express = require('express');
var router = express.Router();

const url = 'localhost:27017/myproject'; // Connection URL
const db = require('monk')(url);
const collection = db.get('serverData');

const { fork } = require('child_process');
let forked = fork('backend.js');

router.get('/', function (req, res, next) {
  return res.render('index')
});

router.get('/api/getdata/:id', function (req, res, next) {
  collection.find({ "guild.id": req.params.id.toString() }, (err, result) => {
    process.stdout.write(`GET Request: getdata : ${req.params.id.toString()}`);
    if (result[0] == undefined) {
      process.stdout.write(`: failed\n`);
      return res.status(404).send("Invalid id/no data saved for id.");
    }
    process.stdout.write(`: success\n`);
    return res.send(result[0]);
  })
})

router.get('/api/getserverids', function (req, res, next) {
  collection.find({}, 'guild' , (err, result) => {
    if (result[0] == undefined) {
      return res.status(404).send("We currently dont have any data stored in the database.");
    }
    let ret = [];
    result.forEach((e)=>{ret.push({'id':e.guild.id,'name':e.guild.name})});
    return res.send(ret);
  })
})

router.get('/api/logserver/invite=:id&period=:period', function (req, res, next) {
  if (req.params.id && !isNaN(parseInt(req.params.period))) { // check if req contains a id also that it contains a valid period
    forked.send({ invite: req.params.id.toString(), time: req.params.period });
    return res.status(200).send();
  } else {
    console.log(`GET Request: logserver : ${"\033[1;31m"}malformed request${"\033[0m"} to log ${req.params.id.toString()} for ${req.params.period.toString()} milliseconds ...`)
    return res.status(400).send();
  }
})

module.exports = router;
