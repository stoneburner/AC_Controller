function switch_on() {
  $.ajax({url:"/switch_on"});
}

function switch_off() {
  $.ajax({
    url:"/switch_off"
  });
}

$( document ).ready(function() {
  $('#temp').easyPieChart({
    scaleColor: false,
    lineWidth: 24,
    lineCap: 'square',
    size: 120,
    animate: false,
    trackColor: '#e5e5e5',
    barColor: '#4e7e94'
  });

  $('.tempslider').slider({
    orientation: "horizontal",
    range: "min",
    min: 10,
    max: 60,
    step: 1,
    value: 30,
    stop: function(event,ui) {
      $.ajax({
        url:"/tempsetting/"+ui.value
      });
    },
    slide: function (event, ui) {
      $('.coolingtemp').html(ui.value);
    }
  });

  $('.timeslider').slider({
    orientation: "horizontal",
    range: "min",
    min: 00,
    max: 23,
    step: 1,
    values: [10,22],
    stop: function(event,ui) {
      $.ajax({
        url:"/start_time_setting/"+ui.values[0]+':00'
      });
      $.ajax({
        url:"/stop_time_setting/"+ui.values[1]+':00'
      });
    },
    slide: function (event, ui) {
      $('.starttime').html(ui.values[0]+':00');
      $('.stoptime').html(ui.values[1]+':00');
    }
  });

  $.getJSON('/state',function(data) {
    $('.timeslider').slider('values',[getHours(data.startTime),getHours(data.stopTime)]);
    $('.starttime').html(data.startTime);
    $('.stoptime').html(data.stopTime);
    $('.tempslider').slider('value',data.maxTemp);
    $('.coolingtemp').html(data.maxTemp);
    $('.current_time').html(data.currentTime);
  });

  refreshchart();
  refreshtemp();
});

function getHours(str) {
  return parseInt(str.substr(0,2));
}

function refreshtemp() {
  $.getJSON('/state',function(data) {
    $('#temp').data('easyPieChart').update(data.temp);
    $('#tempspan').text(data.temp+"°C");
    $('h1.temp').text(data.temp+"°C");
    $('.max_temp').text(data.maxTemp);
    $('.start_time').text(data.startTime+":00");
    $('.stop_time').text(data.stopTime+":00");
    var stateDisplay=$('#statedisplay');
    if (data.switch===true) {
      stateDisplay.removeClass('disabled');
      stateDisplay.removeClass('off');
      stateDisplay.addClass('on');
    } else if (data.isCoolingAllowed===false) {
      stateDisplay.removeClass('on');
      stateDisplay.removeClass('off');
      stateDisplay.addClass('disabled');

    } else {
      stateDisplay.removeClass('disabled');
      stateDisplay.removeClass('on');
      stateDisplay.addClass('off');
    }
    $('.current_time').html(data.currentTime);
  });

  setTimeout(refreshtemp,1000);
}

function refreshchart() {

  var options = {
    xaxis: {
      mode: "time",
      timeformat: "%h:%M"
    },
    yaxis: {
      min: 10,
      max: 70
    }
  };

  $.getJSON('/history', function(series) {
    data = series ;
    $.plot("#timechart", data, options);
    setTimeout(refreshchart,10000);
  });
}

