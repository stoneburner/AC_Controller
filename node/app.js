
/**
 * Module dependencies.
 */

var settings=require('./settings');
var express = require('express');
var http = require('http');
var path = require('path');
var mongo = require('mongoskin');
var moment = require('moment');
var serialport = require('serialport');
var SerialPort=serialport.SerialPort;
var tempmonitor= require('./tempmonitor');
var app = express();
var db = mongo.db(settings.db.url);


app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  //app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser('your secret here'));
  app.use(express.session());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));

  var myserial= new SerialPort(settings.serialport, {baudrate:9600, parser: serialport.parsers.readline("\n")});
  tempmonitor.start(myserial,db);
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', function(req,res) {
  var navdata={};
  navdata.temp=tempmonitor.getTemp();
  navdata.switchstate=tempmonitor.getSwitchState();
  res.render('index',navdata);
});

app.get('/state',function(req,res) {
  res.json({
    temp:tempmonitor.getTemp(),
    switch:tempmonitor.getSwitchState(),
    emergency: tempmonitor.getEmergencyState(),
    isCoolingAllowed:tempmonitor.isCoolingAllowed(),
    maxTemp:tempmonitor.getMaxTemp(),
    startTime:tempmonitor.getStartTime(),
    stopTime:tempmonitor.getStopTime(),
    currentTime:moment().format('HH:mm:ss')
  });
});

app.get('/switch_on',function(req,res) {
  tempmonitor.switchOn();
  res.json({success:true});
});

app.get('/switch_off',function(req,res) {
  tempmonitor.switchOff();
  res.json({success:true});
});

app.get('/tempsetting/:temp',function(req,res) {
  tempmonitor.setMaxTemp(req.params.temp);
});

app.get('/start_time_setting/:time',function(req,res) {
  tempmonitor.setStartTime(req.params.time);
});

app.get('/stop_time_setting/:time',function(req,res) {
  tempmonitor.setStopTime(req.params.time);
});

app.get('/history',function(req,res) {
  result={label:'Temperature',color:'#4e7e94', points:{ show: false } };
  result.data=[];
  result2={label:'Cooling',color:'#b1ca00', points:{ show: false },lines:{show:true,zero:false} };
  result2.data=[];
  result3={label:'Emergency',color:'#ff0000', points:{ show: false },lines:{show:true,zero:false} };
  result3.data=[];
  db.collection('templog').find({},{'skip':0, 'limit':1000 , sort:{'_id':-1}},function(err,cursor) {
    cursor.each(function (err,entry){
      if (entry===null) {
        res.json([result3,result2,result]);
      } else {
        var datapoint=[];
        datapoint.push(entry._id.getTimestamp().getTime());
        datapoint.push(parseFloat(entry.temp1));
        result.data.push(datapoint);
        var switchpoint=0;
        if (entry.switchState===true) {
          switchpoint=100;
        }
        result2.data.push([entry._id.getTimestamp().getTime(),switchpoint]);
        var emergency=0;
        if (entry.emergency===true) {
          emergency=100;
        }
        result3.data.push([entry._id.getTimestamp().getTime(),emergency]);
      }
    });
  });

});

app.get('/report',function(req,res) {
  db.collection('templog').find({},{'skip':0, 'limit':1000 , sort:{'_id':-1}},function(err,cursor) {
    var data=[]
    cursor.each(function (err,entry){
      if (entry!==null) {
        data.push(entry);
      } else {
        res.render('report',{entries:data});
      }
    })
  })
});

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

