//Global variables.
var canvas = document.getElementById("waveCanvas");

//Apparently canvas pixel width and height and 
//the css of the canvas width height are two separate things...
//awkward. 
canvas.width=.7*document.body.clientWidth;
canvas.height=.7*document.body.clientHeight;

var MAX_NUMBER_OF_WAVES = 10;
// set timer to disabled by default
var timer_disabled = true;
//var timer_area = document.getElementById('timer_area');
//timer_area.style.visibility = 'hidden';

var zeroX = canvas.height;
var zeroY = canvas.height/2;
var pixelWavelength = (canvas.width - zeroX);
var maxAmpl = 2;
//maxHeight is in pixels as well.
var maxHeight = canvas.height/2;
//wavelength = ratio of y_max/w_max
var wavelength = pixelWavelength/maxHeight;
var maxWavelength = wavelength*maxAmpl;
var pointsPerWave = 100;
var phasorOriginPoint = new Point(zeroX/2,zeroY);
var velocityOfMedium = 10;
var currentTime=0;
var timeStep = 0.001;
var wavesArray=[];

var resultantWave = new Path({strokeColor:'black', strokeWidth:3});
var resultantPhasor = new Group({strokeColor: 'black', strokeWidth:3});

var play=false;
var tails_at_origin=true;
var showIndividual=true;
var showResultant=true;
var setIntervalInitialized=false;
var setIntervalVariable=null;

//Don't allow to [play] unless everything is okay.
var a_values_okay=true;
var f_values_okay=true;
var phi_values_okay=true;

var a_locked = false;
var a_lock_checkbox = document.getElementById('lock_a');
a_lock_checkbox.addEventListener('change', function() {
  a_locked = a_lock_checkbox.checked;
});

var f_locked = false;
var f_lock_checkbox = document.getElementById('lock_f');
f_lock_checkbox.addEventListener('change', function() {
  f_locked = f_lock_checkbox.checked;
});

var phi_locked = false;
var phi_lock_checkbox = document.getElementById('lock_phi');
phi_lock_checkbox.addEventListener('change', function() {
  phi_locked = phi_lock_checkbox.checked;
});



//Draw the outline to screen.
var phasorOrigin = new Path.Circle({
  center:[zeroX/2,zeroY],
  radius:5,
  strokeColor:'purple'
});

var phasorYaxis = new Path.Line({
  from: [zeroX/2,0],
  to: [zeroX/2,2*canvas.height],
  strokeColor: 'black'
});


//When using python -m SimpleHTTPServer,
//canvas.width doesn't extend to end for some reason.
//Unsure why, but hackily fixed it with 2*canvas.width :^|
var xAxis = new Path.Line({
  from: [0,zeroY],
  to: [2*canvas.width,zeroY],
  strokeColor: 'black'
});

var midline = new Path.Line({
  from: [canvas.height,0],
  to: [canvas.height, 2*canvas.height],
  strokeColor: 'purple'
});

//Calculate helpers.
//Be wary of helpers with 'maxWavelength'
var calcluateKFromOmega = function(omega) {
  return omega / velocityOfMedium;
};
var calculateKFromFrequency = function(frequency) {
  return 2*Math.PI*frequency / velocityOfMedium;
};
var calculateOmegaFromK = function(k) {
  return k * velocityOfMedium;
};
var calculateFrequencyFromOmega = function(omega) {
  return omega/(2*Math.PI);
};
var calculateLambdaFromFrequency = function(frequency) {
  return velocityOfMedium/frequency;
};

var DEFAULT_AMPL = 1;
var DEFAULT_K = Math.PI*2/maxWavelength;
var DEFAULT_OMEGA = calculateOmegaFromK(DEFAULT_K);
var DEFAULT_FREQUENCY = calculateFrequencyFromOmega(DEFAULT_OMEGA);
var DEFAULT_PHI = 0;
var DEFAULT_COLOR = 'blue';
var DEFAULT_DIR = '-';


//Handling the timer.
//var time_elapsed = document.getElementById('time_elapsed');

var resetTimeElapsed = function() {
  currentTime=0;
  clearInterval(setIntervalVariable);
  setIntervalInitialized=false;
  //time_elapsed.innerHTML='0.0';
};

//Divs.
var createTable = function() {
  var table = document.createElement('table');
  table.className = 'tables';
  var thead = document.createElement('thead');
  var head = document.createElement('th');
  head.innerHTML = 'wave table';
  thead.appendChild(head);
  table.appendChild(thead);
  return table;
};

var waveEquationsDiv = document.getElementById('adderArea');
waveEquationsDiv.appendChild(createTable());

var refreshWaveDiv = function() {
  //Clear it up.
  while (waveEquationsDiv.hasChildNodes()) {
	  waveEquationsDiv.removeChild(waveEquationsDiv.lastChild);
  }
  var tableRef = createTable();
  var tbody = document.createElement('tbody');
  tableRef.appendChild(tbody);
  waveEquationsDiv.appendChild(tableRef);
  for(var i = 0; i < wavesArray.length; i++) {
	  var tr = document.createElement('tr');
	  var td = document.createElement('td');
	  tr.appendChild(td);
	  //Refresh the wave DOM.
	  wavesArray[i].refreshWaveDOM();

	  td.appendChild(wavesArray[i].waveDOM);
	  tbody.appendChild(tr);
	  //Regenerating the array index of every wave.
	  wavesArray[i].arrayIndex=i;
  }
};




//Wave constructor.
function Wave(a,k,omega,phi,color,d) {
  //DOM element reference variables.
  //Need these to support import/export.
  this.color_dropdown = null;
  this.amp_input = null; 
  this.lambda_span = null;
  this.dir_dropdown = null;
  this.f_input = null;
  this.phi_input = null;
  this.amp_slider = null;
  this.f_slider = null;
  this.phi_slider = null;

  //Wave's instance variables.
  this.amplitude = a;
  this.k = k;
  this.omega=omega;
  this.phi = phi;
  this.frequency = calculateFrequencyFromOmega(this.omega);
  this.dir=d;

  //Other fields related to displaying.
  //TimeDelta used for moving the wave on the screen.
  this.phiTimeDelta=0;
  this.Xbutton = null;
  this.arrayIndex=-1;
  this.color = color;
  this.path = new Path({strokeColor: this.color, strokeWidth:1});
  this.phasor = new Group();
  this.offsetPoint=null;
  this.dX=0;
  this.dY=0;
  this.isInvisible=false;

  this.setVisible = function() {
	  this.path.opacity=1;
	  this.phasor.opacity=1;
	  this.isInvisible=false;
  };
  this.setInvisible = function() {
	  this.isInvisible=true;
	  this.path.opacity=0;
	  this.phasor.opacity=0;
  };
  this.wipe = function() {
	  this.path.removeSegments();
	  this.phasor.remove();
  };
  
  this.reset=function() {
	  this.phiTimeDelta=0;
	  this.edit(this.amplitude,this.frequency,this.phi,phasorOriginPoint);
  };

  this.edit=function(amplSliderVal, frequencySliderVal,phiSliderVal,pseudoOrigin) {

	  //Update all instance variables.
	  this.amplitude = amplSliderVal;
	  this.frequency = frequencySliderVal;
	  this.phi = phiSliderVal;
	  this.k = calculateKFromFrequency(this.frequency);
	  this.omega = calculateOmegaFromK(this.k);

	  this.path.removeSegments();
	  //Iterate through and re-add points to Wave path.
	  for(var i = 0; i <= pointsPerWave; i++) {
	    var scaleFraction = i/pointsPerWave;
	    var deltaX = scaleFraction*pixelWavelength;
	    //Scaling on the fraction to find out "where I am" on the
	    // wavelength, and then finding out where I am on the 2pi
	    //unit circle.
	    var sinInput = this.frequency*scaleFraction*(2*Math.PI);
	    var scaledHeight = maxHeight/maxAmpl;
	    var deltaY=this.amplitude*scaledHeight*Math.sin(sinInput+this.phi+this.phiTimeDelta);
	    this.path.add(new Point(zeroX+deltaX,zeroY-deltaY));

	  }
	  this.path.smooth();
	  this.editPhasor(pseudoOrigin);

	  //Redraw the resultant wave.
	  //This case only happens when the animation is paused,
	  //or else things will lag, because double drawing.
	  if(showResultant && !play) {
	    refreshResultant();
	  }
  };

  //Helper method for edit to editPhasor. Never called outside of Wave.
  this.editPhasor=function(origin) {
	  this.phasor.remove();
	  var line = new Path();
	  var scaledHeight = maxHeight/maxAmpl;
	  var deltaX=scaledHeight*this.amplitude*Math.cos(this.phi+this.phiTimeDelta);
	  this.dX=deltaX;
	  var deltaY=scaledHeight*this.amplitude*Math.sin(this.phi+this.phiTimeDelta);
	  this.dY=deltaY;
	  var offset = new Point(origin.x+deltaX,
			                     origin.y-deltaY);
	  this.offsetPoint = offset;
	  line.add(origin);
	  line.add(offset);
	  this.phasor = drawArrow(line,offset,origin,this.color,2);
	  if(this.isInvisible) {
	    this.path.opacity=0;
	    this.phasor.opacity=0;
	  }
  };
  
  //Simply redraws everything.
  this.refresh = function() {
	  this.path.remove();
    this.path = new Path({strokeColor: this.color, strokeWidth:1});
	  this.phasor.remove();
    this.phasor=new Group();
    this.edit(this.amplitude, this.frequency, this.phi,phasorOriginPoint);
  };


  //Need to implement this for import/export feature.
  this.refreshWaveDOM = function() {
	  this.color_dropdown.value = this.color;
    this.amp_input.value = this.amplitude;
	  this.lambda_span.innerHTML = parseFloat(calculateLambdaFromFrequency(this.frequency)).toFixed(3);
    this.f_input.value = parseFloat(this.frequency).toFixed(3);

    this.dir_dropdown.value = this.dir;

	  var phi_scaled = this.phi / Math.PI;
	  this.phi_input.value = phi_scaled;

	  this.amp_slider.value = this.amplitude;
	  this.phi_slider.value = this.phi;
  };

  this.toString = function() {
	  var str = ''+this.amplitude+','+
	    this.k+','+this.omega+','+this.phi+','+
	    this.color+','+this.dir;
	  return str;
  };

  
  //Draw initial wave.
  this.edit(this.amplitude,this.frequency,this.phi,phasorOriginPoint);
  this.waveDOM = createWaveDOM(this);
};

//The loop.
function onFrame(event) {
  if(play) {
	  disableButtons();
	  //if(!setIntervalInitialized) {
      // timer code
	    // if(speedSlider.value!=='0') {
	    // 	    set_interval_timing();
	    // }
	  //}
	  refreshWaves();
	  if(showResultant) {
	    refreshResultant();
	  }
  } else {
	  enableButtons();
  }
};

function set_interval_timing() {
  setIntervalVariable = setInterval(function() {
		// currentTime+=.1;
    currentTime+=.00625; // some magic number .1 / 16
		//time_elapsed.innerHTML=''+currentTime.toFixed(1);
	}, (100/speedSlider.value));
  // 100ms / speedSlider factor
	setIntervalInitialized=true;
};


refreshWaves = function() {
  //This iterates through the wavesArray and dynamically updates/redraws 
  //all of the waves onto the screen.
  for(var i = 0; i <wavesArray.length; i++) {
	  var omega = parseFloat(wavesArray[i].omega);
	  //Shouldn't simulate timeStep unless your on play!
	  if(play) {
	    if(wavesArray[i].dir==='-') {
		    wavesArray[i].phiTimeDelta -= omega*timeStep;
      } else {
		    wavesArray[i].phiTimeDelta += omega*timeStep;
	    }
	  }

	  if(showIndividual) {
	    wavesArray[i].setVisible();
	  } else {
	    wavesArray[i].setInvisible();
	  }

	  //This is the part where we actually draw to the screen.
	  //How we edit the waves depends on whether we want the phasors to be 
	  //all tails at origin, or vector added.
	  //We won't see anything on the screen, however, if the individual waves were set to invisible.
	  if(tails_at_origin) {
	    wavesArray[i].edit(wavesArray[i].amplitude,
			                   wavesArray[i].frequency,wavesArray[i].phi,phasorOriginPoint);
	  } else {
	    if(i==0) {
		    //The first phasor should really be at the origin.
		    wavesArray[i].edit(wavesArray[i].amplitude,
				                   wavesArray[i].frequency,wavesArray[i].phi,phasorOriginPoint);
	    } else {
		    wavesArray[i].edit(wavesArray[i].amplitude,
				                   wavesArray[i].frequency,wavesArray[i].phi,wavesArray[i-1].offsetPoint);
	    }
	  }
  }

  refreshResultant();
};


var refreshResultant = function() {
  //resultantWave
  if(showResultant) {
	  resultantWave.removeSegments();
	  if(wavesArray.length>0) {
	    for(var i = 0; i < wavesArray[0].path.segments.length; i++) {
		    var resultantWave_x=0;
		    var resultantWave_y=0;
		    for(var s = 0; s < wavesArray.length; s++) {
		      resultantWave_x=wavesArray[0].path.segments[i].point.x;
		      resultantWave_y = resultantWave_y + (zeroY - wavesArray[s].path.segments[i].point.y);
		    }
		    resultantWave.add(new Point(resultantWave_x, zeroY-resultantWave_y));
		    resultantWave.smooth();
	    }
	  }

	  //resultantPhasor
	  resultantPhasor.remove();
	  var line = new Path();
	  line.add(phasorOriginPoint);
	  var resultant_dX=0;
	  var resultant_dY=0;
	  for(var i=0; i < wavesArray.length; i++) {
	    resultant_dX+=wavesArray[i].dX;
	    resultant_dY-=wavesArray[i].dY;
	  }
	  var resultant_offset = new Point(resultant_dX, resultant_dY);
	  var resultant_dot = phasorOriginPoint+resultant_offset;
	  line.add(resultant_dot);
	  resultantPhasor = drawArrow(line, resultant_dot,phasorOriginPoint,'black',3);
  }
};


var drawArrow = function(phasorPath, offsetPoint, referenceOrigin,color,width) {
  var arrowVector = (offsetPoint-referenceOrigin).normalize(10);
  var group = new Group([
	  phasorPath,
	  new Path([
	    offsetPoint+arrowVector.rotate(-135),
	    offsetPoint,
	    offsetPoint+arrowVector.rotate(135)
	  ])
  ]);
  group.strokeColor=color;
  group.strokeWidth=width;
  return group;
};

//buttons
//Button #1. PLAY button.
var playButton = document.getElementById('play');
//Initially set to disabled, since no waves are added.
var maybeDisablePlayButton = function() {
  if(wavesArray.length===0) {
    playButton.disabled=true;  
  }
};
var enablePlayButton = function() {
  playButton.disabled=false;  
};
playButton.addEventListener('click', function() {
  if(a_values_okay && f_values_okay && phi_values_okay) {
    play=!play;
    if(!play) { //Pause.
	    clearInterval(setIntervalVariable);
	    setIntervalInitialized=false;
    }
    if(playButton.innerHTML === 'Play') {
	    playButton.innerHTML = 'Pause';
    } else {
	    playButton.innerHTML = 'Play';
    }
    disablePhi();
  } else {
    alert('Your wave(s) have incorrect values!');
  }
});
maybeDisablePlayButton();
//Button #2. CLEAR button.
var clearButton = document.getElementById('clear');
clearButton.addEventListener('click', function() {
  clearEverything();
  maybeDisablePlayButton();
  enableButtons();
  //Clear import button
  clearImportButton();
  recheckWaveInputs();
});
var clearEverything = function() {
  for(var i=0; i<wavesArray.length; i++) {
	  wavesArray[i].wipe();
  }
  deleteResultant();
  //lol idk if deleting an array like this is good practice
  wavesArray = [];
  refreshWaveDiv();
  resetPlayButton();
  resetTimeElapsed();
  //Re-enable addWaveButton.
  addWaveButton.disabled = false;
};

var deleteResultant = function() {
  resultantWave.removeSegments();
  resultantPhasor.remove();
};

//Button #3. RESET button.
var resetButton = document.getElementById('reset');
resetButton.addEventListener('click', function() {
  for(var i=0; i<wavesArray.length; i++) {
	  wavesArray[i].reset();
  }
  deleteResultant();
  resetPlayButton();
  resetTimeElapsed();
  //Re-enable addWaveButton.
  addWaveButton.disabled = false;
  refreshWaves();
  enableButtons();
});
var resetPlayButton = function() {
  //Modify the play/pause button manually.
  if(play) {
	  play=!play;
	  if(playButton.innerHTML === 'Play') {
	    playButton.innerHTML = 'Pause';
	  } else {
	    playButton.innerHTML = 'Play';
	  }
  }
};

var addWaveButton = document.getElementById('add_wave');
addWaveButton.addEventListener('click', function() {
  addWave();
});

//Button #5. addWave button.
var addWave = function() {
  if(wavesArray.length<MAX_NUMBER_OF_WAVES) {
	  var k = Math.PI*2/maxWavelength;
	  var omega = calculateOmegaFromK(k);
	  wavesArray.push(new Wave(DEFAULT_AMPL,
				                     DEFAULT_K,
				                     DEFAULT_OMEGA,
				                     DEFAULT_PHI,
				                     DEFAULT_COLOR,
				                     DEFAULT_DIR));
	  refreshWaveDiv();
	  if(showResultant) {
	    refreshResultant();
	  }
    enablePlayButton();
  }
};

//var toggle_timer_button = document.getElementById('toggle_timer');
//toggle_timer_button.addEventListener('click', function() {
  //toggle_timer();
//});

// //Button #6. Toggle Timer
// var toggle_timer = function() {
//   if (timer_disabled) {
//     timer_area.style.visibility = 'visible';
//   } else {
//     timer_area.style.visibility = 'hidden';
//   }
//   timer_disabled = !timer_disabled;
// };



var addCustomWave = function(ampl,k,omega,phi,color,dir) {
  if(wavesArray.length<MAX_NUMBER_OF_WAVES) {
	  wavesArray.push(new Wave(ampl,k,omega,phi,color,dir));
	  refreshWaveDiv();
	  if(showResultant) {
	    refreshResultant();
	  }
    enablePlayButton();
  }
};



var speedSlider = document.getElementById('speed');
var speed_val = document.getElementById('speed_val');
speedSlider.addEventListener('input', function() {
  var speedVal = speedSlider.value;
  var scaled = parseFloat(speedVal).toFixed(3);
  speed_val.innerHTML=''+scaled;
  speedVal = parseFloat(speedVal);
  // Scale the timeStep downwards.
  timeStep=speedVal/1000;
  //Modifying the timer on the screen.
  if(play) {
    // timer code
  	  clearInterval(setIntervalVariable);
  	  if(speedVal!==0) {
      set_interval_timing();
    }
  }
});

var phasorTailsSelector = document.getElementById('phasor_tails');
phasorTailsSelector.addEventListener('change', function() {
  tails_at_origin=!tails_at_origin;
  refreshWaves();
});

var wavesToShowSelector = document.getElementById('wave_option');
wavesToShowSelector.addEventListener('change', function() {
  if(wavesToShowSelector.value === 'show_all') {
	  showIndividual=true;
	  showResultant=true;
  }
  if(wavesToShowSelector.value === 'resultant_only') {
	  showIndividual=false;
	  showResultant=true;
  }
  if(wavesToShowSelector.value === 'individual_only') {
	  showIndividual=true;
	  deleteResultant();
	  showResultant=false;
  }
  refreshWaves();
});



var importButton = document.getElementById('import');
importButton.addEventListener('change', function(e) {
  var file = e.target.files[0];
  if(!file) {
	  return;
  }
  var reader = new FileReader();
  reader.onload = function(e) {
	  clearEverything();
	  var contents = e.target.result;
	  var arr = contents.split("!!!");
	  for(var i = 0; i < arr.length; i++) {
	    var waveParts = arr[i].split(",");
	    var ampl = parseFloat(waveParts[0]);
	    var k = parseFloat(waveParts[1]);
	    var omega = parseFloat(waveParts[2]);
	    var phi = parseFloat(waveParts[3]);
	    var color = waveParts[4];
	    var dir = waveParts[5];
      console.log(waveParts);
	    if(!isNaN(ampl) && !isNaN(k) && !isNaN(omega) &&
	       !isNaN(phi)) {
		    addCustomWave(ampl,k,omega,phi,color,dir);
		    refreshWaveDiv();
		    refreshResultant();
	    }
	  }
    //Refresh all waves
    refreshWaves();
  };
  reader.readAsText(file);
});

var clearImportButton = function() {
  importButton.value="";
};


var exportButton = document.getElementById('export_waves');
exportButton.addEventListener('click', function() {
  exportToCSV();
  
});

var exportToCSV = function() {
  if(wavesArray.length>0) {
	  var text = '';
	  for(var i = 0; i < wavesArray.length; i++) {
	    text = text + wavesArray[i].toString()+'!!!';
	  }
    window.open('data:text/csv;charset=utf-8,'+text);
  } else {
    alert('No waves to export.');
  }
  
};

//Helpers to create the wave DOM.
createColorDropdown = function(waveObj) {
  var select = document.createElement('select');
  var blue = document.createElement('option');
  blue.text='Blue';
  blue.value='Blue';
  var green = document.createElement('option');
  green.text='Green';
  green.value='Green';
  var red = document.createElement('option');
  red.text='Red';
  red.value='Red';
  var orange = document.createElement('option');
  orange.text='Orange';
  orange.value='Orange';
  var purple = document.createElement('option');
  purple.text='Purple';
  purple.value='Purple';
  select.add(blue);
  select.add(green);
  select.add(red);
  select.add(orange);
  select.add(purple);
  select.addEventListener('change', function() {
	  waveObj.color=select.value;
	  waveObj.refresh();
    refreshWaves();
  });
  return select;
};


createWaveEqn = function(waveObj) {
  var eqn = document.createElement('span');
  var y_x_t = document.createTextNode('y(x,t) = ');
  eqn.appendChild(y_x_t);

  var amplInput = document.createElement('input');
  amplInput.value = '1.00';
  amplInput.size = '4';
  waveObj.amp_input = amplInput;
  eqn.appendChild(amplInput);
  amplInput.addEventListener('keydown', function() {
    //[enter]
    if(event.keyCode == 13) {
      var floatVal = parseFloat(amplInput.value);
      if(!isNaN(floatVal) && floatVal>=0.00 && floatVal<=2.00) {
        //should make sure value is within domain
        waveObj.amplitude = floatVal;
        waveObj.amp_slider.value=''+floatVal;
        waveObj.edit(floatVal, waveObj.frequency, 
                     waveObj.phi, phasorOriginPoint);
        
        //Visual show that a_value is okay.
        a_values_okay=true;
        amplInput.style.backgroundColor='white';

        refreshWaves();
      } else {
        //Error: turn red.
        amplInput.style.backgroundColor='#FF6666';
        a_values_okay=false;
      }
    }
  });
  
  var sin_txt = document.createTextNode('sin( ');
  eqn.appendChild(sin_txt);
  var two_pi = document.createTextNode('2\u03C0/(');
  eqn.appendChild(two_pi);


  var lambda_span = document.createElement('span');
  waveObj.lambda_span = lambda_span;
  eqn.appendChild(lambda_span);
  var x_txt = document.createTextNode(') x ');
  eqn.appendChild(x_txt);
  var dir_dropdown = document.createElement('select');
  var minus = document.createElement('option');
  minus.text='-'; minus.value='-';
  dir_dropdown.add(minus);
  waveObj.dir_dropdown = dir_dropdown;
  var plus = document.createElement('option');
  plus.text='+'; plus.value='+';
  dir_dropdown.add(plus);
  dir_dropdown.addEventListener('change', function() {
	  waveObj.dir=dir_dropdown.value;
	  refreshWaves();
  });
  eqn.appendChild(dir_dropdown);
  
  var two_pi_x = document.createTextNode(' 2\u03C0(');
  eqn.appendChild(two_pi_x);
  
  var fInput = document.createElement('input');
  fInput.size='5';
  waveObj.f_input = fInput;
  eqn.appendChild(fInput);

  fInput.addEventListener('keydown', function() {
    //[enter]
    if(event.keyCode == 13) {
      var floatVal = parseFloat(fInput.value);
      if(!isNaN(floatVal) && floatVal>=.5 && floatVal<=15) {
        //should make sure value is within domain
	      waveObj.frequency = floatVal;
	      var lambda = parseFloat(calculateLambdaFromFrequency(floatVal)).toFixed(3);
	      waveObj.lambda_span.innerHTML = lambda;

	      waveObj.f_input.value = floatVal;

	      var k = calculateKFromFrequency(floatVal);
	      var omega = calculateOmegaFromK(k);
	      waveObj.k = k;
	      waveObj.omega = omega;
	      waveObj.edit(waveObj.amplitude, floatVal,
                     waveObj.phi,phasorOriginPoint);

        //Visual show that f values are okay.
        fInput.style.backgroundColor='white';
        f_values_okay=true;

	      refreshWaves();
      } else {
        //Error: red.
        fInput.style.backgroundColor='#FF6666';
        f_values_okay=false;
      }
    }
  });


  //t +
  var t_plus_txt = document.createTextNode(')t + ');
  eqn.appendChild(t_plus_txt);
  //[0]
  var phiInput = document.createElement('input');
  phiInput.value='0.000';
  phiInput.size='4';
  waveObj.phi_input = phiInput;
  eqn.appendChild(phiInput);
  phiInput.addEventListener('keydown', function() {
	  //[enter] 
	  if(event.keyCode == 13) {
      if(!isNaN(parseFloat(phiInput.value))) {
	      var floatVal = eval(phiInput.value)*Math.PI;
        if(floatVal>=-2*Math.PI && floatVal<=2*Math.PI) {
	        waveObj.phi_slider.value=''+floatVal;
	        waveObj.edit(waveObj.amplitude,waveObj.frequency, floatVal, phasorOriginPoint);

          //Visual show that phi is okay.
          phiInput.style.backgroundColor='white';
          phi_values_okay=true;

	        refreshWaves();
        }
      } else {
        //Error: turn red.
        phiInput.style.backgroundColor='#FF6666';
        phi_values_okay=false;
      }
	  }
  });

  //pi)
  var end_paren_txt = document.createTextNode('\u03C0)');
  eqn.appendChild(end_paren_txt);
  
  return eqn;
};

createWaveSlidersDOM = function(waveObj) {
  var sliders = document.createElement('span');
  var alpha = document.createElement('span');
  alpha.innerHTML='A';
  sliders.appendChild(alpha);

  var minispace = document.createElement('span');
  minispace.innerHTML = '&nbsp;&nbsp;';

  var a_slider = document.createElement('input');
  a_slider.type='range';
  a_slider.className='sliders'; 
  a_slider.min='0';
  a_slider.max='2';
  a_slider.step='0.01';
  a_slider.addEventListener('input', function() {
    if(a_locked) {
      for(var i = 0; i < wavesArray.length; i++) {
        var delta = a_slider.value - waveObj.amplitude;
        var new_ampl = parseFloat(wavesArray[i].amp_slider.value)+delta;
        if(new_ampl<0) { new_ampl=0; }
        if(new_ampl>2) { new_ampl=2; }
        if(waveObj.arrayIndex!=i && new_ampl<=2 && new_ampl>=0) {
          wavesArray[i].amp_slider.value=new_ampl;
          wavesArray[i].amplitude=new_ampl;
          wavesArray[i].amp_input.value = new_ampl;
          wavesArray[i].refresh();
        }
      }
    }
    //update the original waveObj
	  waveObj.amplitude=a_slider.value;
    waveObj.amp_input.value = a_slider.value;
	  waveObj.refresh();
	  refreshWaves();

    //Turn off red amp_input.
    waveObj.amp_input.style.backgroundColor='white';
  });
  sliders.appendChild(a_slider);
  waveObj.amp_slider = a_slider;
  sliders.appendChild(minispace);
  var num_frequency_span = document.createElement('span');
  num_frequency_span.innerHTML = 'f';
  sliders.appendChild(num_frequency_span);
  sliders.appendChild(minispace);

  var frequency_slider = document.createElement('input');
  frequency_slider.type='range';
  frequency_slider.className='sliders';
  frequency_slider.min='.5';
  frequency_slider.max='15';
  frequency_slider.step='.001';
  frequency_slider.value=''+waveObj.frequency;
  waveObj.f_slider = frequency_slider;
  frequency_slider.addEventListener('input', function() {
    if(f_locked) {
      var delta = parseFloat(waveObj.f_slider.value)-waveObj.frequency;
      for(var i = 0; i < wavesArray.length; i++) {
        var new_freq = delta + parseFloat(wavesArray[i].f_slider.value);
        if(new_freq>15) { new_freq = 15; }
        if(new_freq<0.5) { new_freq = 0.5; }
        if(waveObj.arrayIndex!=i) {
	        wavesArray[i].frequency = new_freq;
          wavesArray[i].f_slider.value = new_freq;
	        var lambda = parseFloat(calculateLambdaFromFrequency(new_freq)).toFixed(3);
          console.log(lambda);
	        wavesArray[i].lambda_span.innerHTML = ''+lambda;
	        wavesArray[i].f_input.value = parseFloat(new_freq).toFixed(3);
	        var k = calculateKFromFrequency(new_freq);
	        var omega = calculateOmegaFromK(k);
	        wavesArray[i].k = k;
	        wavesArray[i].omega = omega;
	        wavesArray[i].edit(wavesArray[i].amplitude, wavesArray[i].frequency, wavesArray[i].phi,phasorOriginPoint);        
          wavesArray[i].refresh();
        }
      }
    }
    
    //Edit the current waveObj's frequency stuff.
	  waveObj.frequency = frequency_slider.value;
	  var lambda = parseFloat(calculateLambdaFromFrequency(frequency_slider.value)).toFixed(3);
	  waveObj.lambda_span.innerHTML = lambda;
	  waveObj.f_input.value = frequency_slider.value;
	  var k = calculateKFromFrequency(frequency_slider.value);
	  var omega = calculateOmegaFromK(k);
	  waveObj.k = k;
	  waveObj.omega = omega;
	  waveObj.edit(waveObj.amplitude, frequency_slider.value, waveObj.phi,phasorOriginPoint);

	  refreshWaves();

    //Turn off red f_input.
    waveObj.f_input.style.backgroundColor='white';
  });

  sliders.appendChild(frequency_slider);
  sliders.appendChild(minispace);

  var phi = document.createElement('span');
  phi.innerHTML='&phi;';
  sliders.appendChild(phi);
  var phi_slider = document.createElement('input');
  phi_slider.type='range';
  phi_slider.className='sliders';
  phi_slider.min='-6.283185307179586';
  phi_slider.max='6.283185307179586';
  phi_slider.step='0.00000001';
  phi_slider.value='0';
  sliders.appendChild(phi_slider);
  waveObj.phi_slider = phi_slider;

  sliders.appendChild(minispace);

  phi_slider.addEventListener('input', function() {
    if(phi_locked) {
      for(var i = 0; i < wavesArray.length; i++) {

        var delta = parseFloat(waveObj.phi_slider.value)-waveObj.phi;
        var new_phi = parseFloat(wavesArray[i].phi_slider.value) + delta;

        if(new_phi>6.283) { new_phi=6.283185307179586; }
        if(new_phi<-6.283) { new_phi=-6.283185307179586; }
        if(waveObj.arrayIndex!=i) {
          wavesArray[i].phi_slider.value=new_phi;
          wavesArray[i].phi=new_phi;
          wavesArray[i].refresh();

	        var scaleByPi = parseFloat(wavesArray[i].phi) / Math.PI;
	        scaleByPi = parseFloat(scaleByPi).toFixed(3);
          //Edit textual phi input.
	        wavesArray[i].phi_input.value=''+scaleByPi;
	        wavesArray[i].edit(wavesArray[i].amplitude,wavesArray[i].frequency, parseFloat(wavesArray[i].phi), phasorOriginPoint);
        }
      }
    }

    waveObj.phi = parseFloat(waveObj.phi_slider.value);
	  var scaleByPi = parseFloat(phi_slider.value) / Math.PI;
	  scaleByPi = parseFloat(scaleByPi).toFixed(3);
    //Edit textual phi input.
	  waveObj.phi_input.value=''+scaleByPi;
	  waveObj.edit(waveObj.amplitude,waveObj.frequency, parseFloat(phi_slider.value), phasorOriginPoint);

	  refreshWaves();

    //Turn off red phi_input.
    waveObj.phi_input.style.backgroundColor='white';
  });

  return sliders;
};

createWaveDOM = function(waveObj) {
  var wave = document.createElement('div');
  var colorDropdown = createColorDropdown(waveObj);
  var eqn = createWaveEqn(waveObj);
  var newline = document.createElement('span');
  newline.innerHTML='<br>';
  var sliders = createWaveSlidersDOM(waveObj);

  wave.appendChild(eqn);
  wave.appendChild(newline);

  wave.appendChild(sliders);
  wave.appendChild(colorDropdown);


  var deleteButton = document.createElement('button');
  deleteButton.innerHTML='X';
  waveObj.Xbutton = deleteButton;
  deleteButton.addEventListener('click', function() {
	  waveObj.wipe();
	  wavesArray.splice(waveObj.arrayIndex,1);
	  refreshWaveDiv();
	  refreshResultant();
    maybeDisablePlayButton();
    recheckWaveInputs();

  });
  var space = document.createElement('span');
  space.innerHTML = '&nbsp;&nbsp;&nbsp;&nbsp;';
  wave.appendChild(space);
  wave.appendChild(deleteButton);


  //Hand the waveObj the necessary reference for color.
  waveObj.color_dropdown = colorDropdown;
  return wave;
};

var disablePhi = function() {
  for(var i = 0; i < wavesArray.length; i++) {
    wavesArray[i].phi_input.disabled=true;
    wavesArray[i].phi_slider.disabled=true;
  }
  phi_lock_checkbox.disabled=true;
};

var enablePhi = function() {
  for(var i = 0; i < wavesArray.length; i++) {
    wavesArray[i].phi_input.disabled=false;
    wavesArray[i].phi_slider.disabled=false;
  }
  phi_lock_checkbox.disabled=false;
};


var disableButtons = function() {
  addWaveButton.disabled = true;
  for(var i = 0; i < wavesArray.length; i++) {
    //Disable delete button.
	  wavesArray[i].Xbutton.disabled=true;

    //Disable all the stuff.
    wavesArray[i].color_dropdown.disabled=true;
    wavesArray[i].amp_input.disabled=true;
    wavesArray[i].lambda_span.disabled=true;
    wavesArray[i].dir_dropdown.disabled=true;
    wavesArray[i].f_input.disabled=true;
    wavesArray[i].phi_input.disabled=true;
    wavesArray[i].amp_slider.disabled=true;
    wavesArray[i].f_slider.disabled=true;
    wavesArray[i].phi_slider.disabled=true;
  }
  //Lock buttons.
  a_lock_checkbox.disabled=true;
  f_lock_checkbox.disabled=true;
  phi_lock_checkbox.disabled=true;

};

var enableButtons = function() {
  for(var i = 0; i < wavesArray.length; i++) {
    //Enable delete button.
	  wavesArray[i].Xbutton.disabled=false;

    //Enable all the stuff.
    wavesArray[i].color_dropdown.disabled=false;
    wavesArray[i].amp_input.disabled=false;
    wavesArray[i].lambda_span.disabled=false;
    wavesArray[i].dir_dropdown.disabled=false;
    wavesArray[i].f_input.disabled=false;
    wavesArray[i].amp_slider.disabled=false;
    wavesArray[i].f_slider.disabled=false;

    //phi: Only enable if time has just started.
    if(currentTime===0) {
      wavesArray[i].phi_slider.disabled=false;
      wavesArray[i].phi_input.disabled=false;
      phi_lock_checkbox.disabled=false;
    }
  }
  //Lock buttons.
  a_lock_checkbox.disabled=false;
  f_lock_checkbox.disabled=false;
};


var recheckWaveInputs = function() {
  if(check_if_okay) {
    a_values_okay=true;
    f_values_okay=true;
    phi_values_okay=true;
  }
};

var check_if_okay = function() {
  for(var i = 0; i < wavesArray.length; i++) {
    if(!checkWave) {
      return false;
    }
  }
  return true;
};


var checkWave = function(wave) {
  if (wave.amplitude < 0 || wave.amplitude > 2) {
    return false;
  } else if (wave.omega < .5 || wave.omega > 15) {
    return false; 
  } else if (wave.phi < -6.283185307179586 || 
             wave.phi > 6.283185307179586) {
    return false;  
  }
  return true;
};
