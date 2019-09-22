var clientIdForTheSession;
var isRecording = false;
var postId = 1;
var confidenceArray = []
var fileCount = 0;

function byteToHex(byte) {
  return ('0' + byte.toString(16)).slice(-2);
}

function generateId(len = 40) {
  var arr = new Uint8Array(len / 2);
  window.crypto.getRandomValues(arr);
  return Array.from(arr, byteToHex).join("");
}

console.log(generateId())

var radialObj = radialIndicator('#indicatorContainer', {
     barColor: {
        0: '#FF0000',
        33: '#FFFF00',
        66: '#0066FF',
        100: '#33CC33'
    },
    frameTime:15,
    radius: (screen.height*12)/100,
    barWidth : 10,
    initValue : 0,
    percentage: true
});
function getAverage(element){
var sum = 0;
for( var i = 0; i < element.length; i++ ){
    sum += parseInt( element[i], 10 ); //don't forget to add the base
}
   return(sum/element.length)
}
var contextGraph = document.getElementById('myLineChart');

// this post id drives the example data

var myChart = new Chart(contextGraph, {
  type: 'line',
  data: {
    labels: ['','','','','','','','','',''],
    datasets: [{
      data: [0,0,0,0,0,0,0,0,0,0],
      pointRadius: 0,
      borderWidth: 3,
      borderColor:'#00c0ef',
    }]
  },
  options: {
    grid: {show: false},
    responsive: true,
    title: {
      //display: true,-
      //text: "Chart.js - Dynamically Update Chart Via Ajax Requests",
    },
    legend: {
      display: false
    },
    scales: {
        xAxes: [{
            display: true,
            showGrid: false,
            scaleLabel: {
                display: true,
                labelString: 'Confidence fluctuation per 10  second'
            },
        splitLine: {
                show: false
            },
        gridLines: {
                color: "rgba(0, 0, 0, 0)",
            }
        }],
        yAxes: [{
            display: false,
            scaleLabel: {
                display: false,
                labelString: 'Confidence'
            },
              ticks: {
                          beginAtZero:true,
                          min: 0,
                          max: 100    
                      },
        splitLine: {
                show: false
            },
        gridLines: {
                color: "rgba(0, 0, 0, 0)",
            }
        }]
    }
  }
});


//Intialiazation 
function __log(e, data) {
    console.log(e + data);
  }
  var audio_context;
  var recorder;
  let timerId;
  var isRecording = false;
  var formData = new FormData();
  // var wsh = new WebSocket( 'ws://' + window.location.href.split( '/' )[2] + '/ws' );
  function startUserMedia(stream) {
    var input = audio_context.createMediaStreamSource(stream);
    __log('Media stream created.');
    // Uncomment if you want the audio to feedback directly
    //input.connect(audio_context.destination);
    //__log('Input connected to audio context destination.');
    
    recorder = new Recorder(input);
    __log('Recorder initialised.');
  }

  function startRecording() {
    recorder && recorder.record();
    __log('Recording...');

    timerId = setInterval(function tick(){
      createDownloadLink();
      recorder.clear();
      recorder.record();
    }, 11000);
  }
  


  function stopRecording() {
    clearInterval(timerId);
    recorder && recorder.stop();
    __log('Stopped recording.');
    // create WAV download link using audio data blob
    createDownloadLink();
    if(recorder != undefined)
      recorder.clear();
  }
  


  function createDownloadLink() {
    recorder && recorder.exportWAV(function(blob) {
            var saveData = $.ajax({
            type: "POST",
             url: "https://voice-emotional-analytics-api.herokuapp.com/" + clientIdForTheSession+ '_' + fileCount,
            //url: "http://localhost:5000/" + clientIdForTheSession + '_' + fileCount,
            data: blob,
            processData: false,
            contentType: false,
            xhrFields: {
              withCredentials: true
            },
            crossDomain: true,
            'error' : function(request,error) {
                        console.log(blob);
                    },
            success: function(resultData){
                console.log(resultData)
                // var obj = JSON.parse(resultData);
                // console.log(obj);
                fileCount = fileCount + 1;
                    if(myChart.data.labels.length >10){
                        confidenceArray.push(resultData.confidence*100)
                        radialObj.animate(resultData.confidence*100);
                        myChart.data.labels.shift();
                        myChart.data.datasets[0].data.shift();
                        myChart.data.labels.push(postId++);
                        myChart.data.datasets[0].data.push(resultData.confidence*100);
                        myChart.update();
                        console.log(resultData);
                    } else {
                        confidenceArray.push(resultData.confidence*100)
                        radialObj.animate(resultData.confidence*100);
                        myChart.data.labels.push(postId++);
                        myChart.data.datasets[0].data.push(resultData.confidence*100);
                        myChart.update();
                        console.log(resultData);
                    }
            }
      });
    });
  }
  function startRecordingMic() {
    try {
      // webkit shim
      window.AudioContext = window.AudioContext || window.webkitAudioContext;
      navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia;
      window.URL = window.URL || window.webkitURL;
      audio_context = new AudioContext;
      __log('Audio context set up.');
      __log('navigator.getUserMedia ' + (navigator.getUserMedia ? 'available.' : 'not present!'));
    } catch (e) {
      alert('No web audio support in this browser!');
    }
    
    navigator.getUserMedia({audio: true}, startUserMedia, function(e) {
      __log('No live audio input: ' + e);
    });
  };

function startRecord()
{
    document.getElementById( "record").innerHTML = "<i class='fa fa-stop-circle-o' aria-hidden='true'></i>";
    document.getElementById( "record").className = "Rec";
    document.getElementById( "encode" ).disabled = true;   
    isRecording = true;
    startRecording();
    console.log( 'started recording' ); 
}

function stopRecord()
{
    isRecording  = false;
    stopRecording();
    document.getElementById( "record").innerHTML = "<i class='fa fa-microphone' aria-hidden='true'></i>";
    document.getElementById( "record").className = "notRec";
    document.getElementById( "encode" ).disabled = false;
    console.log( 'ended recording' );    
}

function toggleRecord() 
{
    if( isRecording ){
        openForm();
        stopRecord();
    }
    else {
        startRecord();
    }
}

function openForm() {
 var rect = document.getElementById( "record").getBoundingClientRect();
 console.log(rect.top, rect.right, rect.bottom, rect.left);
 document.getElementById("myForm").style.top = rect.top-330;
 document.getElementById("myForm").style.left= rect.left+110;
 document.getElementById("myForm").style.display = "block";
}


function showUploadForm() {
 var rect = document.getElementById( "record").getBoundingClientRect();
 console.log(rect.top, rect.right, rect.bottom, rect.left);
 document.getElementById("myUploadForm").style.top = rect.top-370;
 document.getElementById("myUploadForm").style.left= rect.left+70;
 document.getElementById("myUploadForm").style.display = "block";
}

function sendFileName(fileName){
$.ajax({

    url : "https://voice-emotional-analytics-api.herokuapp.com/save/" +fileName+"/" + clientIdForTheSession,
    type : 'GET',
    data : {
    },
    dataType:'json',
    success : function(data) {              
        console.log('Data: '+data.location);
    },
    error : function(request,error)
    {
      console.log("Request: "+JSON.stringify(request));
    }
});
}

function removeFile(){
$.ajax({

    url :  "https://voice-emotional-analytics-api.herokuapp.com/remove/"+ clientIdForTheSession,
    type : 'GET',
    data : {
    },
    dataType:'json',
    success : function(data) {              
        console.log('Data: '+data);
    },
    error : function(request,error)
    {
      console.log("Request: "+JSON.stringify(request));
    }
});
}

function saveFile() {
 var filename = document.getElementById("fileToBeSaved").value;
 console.log(filename);
 if(filename !== ''){   
    sendFileName(filename);
    console.log("Saving File");
    document.getElementById("myForm").style.display = "none";
    $(':input').val('');
    resetEverything() 
    console.log("Closed Window");
    }
}

function closeForm() {
 console.log("Closing window");
 document.getElementById("myForm").style.display = "none";
 stopRecord();
 $(':input').val('');
 removeFile();
 resetEverything() 
}       
function closeUploadForm() {
 document.getElementById("myUploadForm").style.display = "none";
 console.log("Closing upload window");
}

function resetEverything() {
 radialObj.animate(0);
 var postId = 1;
 for ( i=0;i<11;i++){
    myChart.data.labels.shift();
    myChart.data.datasets[0].data.shift();
    myChart.data.labels.push('');
    myChart.data.datasets[0].data.push(0); 
 }
 myChart.update();
 stopRecord();  
 clientIdForTheSession = generateId();
 fileCount = 0;
 console.log("Reset Everything");
}

function myInitiateMic(){
  startRecordingMic();
  clientIdForTheSession = generateId();
  console.log(clientIdForTheSession);
}