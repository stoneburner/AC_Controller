var moment=require('moment');
var serialport = require('serialport');
var SerialPort=serialport.SerialPort;

var temp1=-1;
var maxTemp=27;
var startTime='00:00';
var stopTime='00:00';

var emergency=false;
var switchState=false;
var myserial;
var db;

exports.start=function(serialport,mongodb) {
  myserial=serialport;
  db=mongodb;

  loadSettings();

  myserial.on('open',function(){
    console.log('serial init.')
    setTimeout(storeStats,10000);
  });

  myserial.on('data',function(data) {
    var str= new String(data);
    if (str!='') {
      if (/T(.*?)S(.)E(.)/.test(str)) {
        temp1 = RegExp.$1;
        switchState = RegExp.$2 === '1';
        emergency = RegExp.$3 === '1';

        if (temp1 > maxTemp && coolingAllowed() === true) {
          myserial.write("1\n");
        }

        if (temp1 > maxTemp && coolingAllowed()===false) {
          myserial.write("0\n");
        }

        if (temp1 < maxTemp && switchState === true) {
          myserial.write("0\n");
        }
      }

    }
  });
};

function coolingAllowed() {
  var start=moment(moment().format('YYYY-MM-DD')+'T'+startTime).unix();
  var stop=moment(moment().format('YYYY-MM-DD')+'T'+stopTime).unix();
  var now=moment().unix();
  return  (now > start && now < stop);
}

function loadSettings() {
  db.collection('settings').findOne(function(err,data){
    if (!err && data) {
      maxTemp=data.max_temp;
      startTime=data.start_time;
      stopTime=data.stop_time;
    } else {
      var defaults={max_temp:30,start_time:'08:00',stop_time:'22:00'};
      db.collection('settings').save(defaults);
    }
  });

}

function storeStats() {
  if (temp1 !== -1) {
    console.log("temp logged:"+temp1);
    db.collection('templog').save({temp1:temp1,switchState:switchState,emergency:emergency,date:new Date()},{strict:true},function(err){
      if (err) {
        console.log(err);
      }
    });
  }
  setTimeout(storeStats,60*1000);
}

exports.getMaxTemp=function() {
  return maxTemp;
};

exports.setMaxTemp=function(_maxTemp) {
  maxTemp=_maxTemp;
  db.collection('settings').findOne(function(err,result) {
    if (!err) {
      result.max_temp=maxTemp;
      db.collection('settings').save(result);
    }
  });
};

exports.setStartTime=function(_startTime) {
  startTime=_startTime;
  db.collection('settings').findOne(function(err,result) {
    if (!err) {
      result.start_time=startTime;
      db.collection('settings').save(result);
    }
  });
};

exports.setStopTime=function(_stopTime) {
  stopTime=_stopTime;
  db.collection('settings').findOne(function(err,result) {
    if (!err) {
      result.stop_time=stopTime;
      db.collection('settings').save(result);
    }
  });
};

exports.getStartTime=function() {
  return startTime;
};

exports.getStopTime=function() {
  return stopTime;
};

exports.getTemp=function() {
  return temp1;
};

exports.getSwitchState=function() {
  return switchState;
};

exports.isCoolingAllowed=function() {
  var start=moment(moment().format('YYYY-MM-DD')+'T'+startTime).unix();
  var stop=moment(moment().format('YYYY-MM-DD')+'T'+stopTime).unix();
  var now=moment().unix();
  return  (now > start && now < stop);
};

exports.getEmergencyState=function() {
  return emergency;
};

exports.switchOn=function() {
  myserial.write("1\n");
  switchState=true;
};

exports.switchOff=function() {
  myserial.write("0\n");
  switchState=false;
};