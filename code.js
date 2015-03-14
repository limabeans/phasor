//Global variables.
var canvas = document.getElementById("waveCanvas");
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
var setIntervalVariable = null;


//Draw the outline to screen.
var phasorOrigin = new Path.Circle({
    center:[zeroX/2,zeroY],
    radius:5,
    strokeColor:'purple'
});

var amplTick = new Path.Line({
    from:[zeroX-10, zeroY - (canvas.height/2)/maxAmpl],
    to:[zeroX+10, zeroY - (canvas.height/2)/maxAmpl],
    strokeColor: 'green'
});

var wavelengthTick = new Path.Line({
    from: [zeroX + pixelWavelength/2, -10 + zeroY],
    to: [zeroX + pixelWavelength/2 ,10 + zeroY],
    strokeColor: 'red'
    
});
var phasorXaxis = new Path.Line({
    from: [0, zeroY],
    to: [canvas.height, zeroY],
    strokeColor: 'black'
});
var phasorYaxis = new Path.Line({
    from: [zeroX/2,0],
    to: [zeroX/2,canvas.height],
    strokeColor: 'black'
});

var dividerLine = new Path.Line({
    from: [canvas.height,0],
    to: [canvas.height, canvas.height],
    strokeColor: 'purple'
});
var midwayLine = new Path.Line({
    from: [canvas.height,zeroY],
    to: [canvas.width, zeroY],
    strokeColor: 'black'
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
var time_elapsed = document.getElementById('time_elapsed');
var resetTimeElapsed = function() {
    currentTime=0;
    clearInterval(setIntervalVariable);
    setIntervalInitialized=false;
    time_elapsed.innerHTML='0';

};
var incrementTimeElapsed = function(timeStep) {
    var scaledTime = .1;
    currentTime+=scaledTime;
    if(currentTime%1===0) {
	var textTime = ''+parseFloat(currentTime).toFixed(0);
	time_elapsed.innerHTML=textTime;
    }
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
    this.amp_span = null;
    this.lambda_span = null;
    this.dir_dropdown = null;
    this.f2_span = null;
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
	this.amp_span.innerHTML = this.amplitude;
	this.lambda_span.innerHTML = parseFloat(calculateLambdaFromFrequency(this.frequency)).toFixed(3);
	this.f2_span.innerHTML = parseFloat(this.frequency).toFixed(3);
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
	if(!setIntervalInitialized) {
	    if(speedSlider.value!=='0') {
		setIntervalVariable = setInterval(function() {
		    currentTime+=1;
		    time_elapsed.innerHTML=''+currentTime;
		}, 1000/speedSlider.value);
		setIntervalInitialized=true;
	    }
	}
	refreshWaves();
	if(showResultant) {
	    refreshResultant();
	}
    } else {
	enableButtons();
    }
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
playButton.addEventListener('click', function() {
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
});
//Button #2. CLEAR button.
var clearButton = document.getElementById('clear');
clearButton.addEventListener('click', function() {
    clearEverything();
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
    clearExportArea();
    //Re-enable addWaveButton.
    addWaveButton.disabled = false;
};
var clearExportArea = function() {
    exportArea.innerHTML = '';    
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
    clearExportArea();
    //Re-enable addWaveButton.
    addWaveButton.disabled = false;
    refreshWaves();
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
    if(wavesArray.length<5) {
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
    }
};

var addCustomWave = function(ampl,k,omega,phi,color,dir) {
    if(wavesArray.length<5) {

	wavesArray.push(new Wave(ampl,k,omega,phi,color,dir));
	refreshWaveDiv();
	if(showResultant) {
	    refreshResultant();
	}
    }
};



var speedSlider = document.getElementById('speed');
var speed_val = document.getElementById('speed_val');
speedSlider.addEventListener('input', function() {
    var speedVal = speedSlider.value;
    var scaled = parseFloat(speedVal).toFixed(3);
    speed_val.innerHTML=''+scaled;
    speedVal = parseFloat(speedVal);
    //Scale the timeStep downwards.
    timeStep=speedVal/1000;
    //Modifying the timer on the screen.
    if(play) {
	clearInterval(setIntervalVariable);
	if(speedVal!==0) {
	    setIntervalVariable = setInterval(function() {
		currentTime+=1;
		time_elapsed.innerHTML=''+currentTime;
	    }, 1000/speedVal);
	    setIntervalInitialized=true;
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
	var arr = contents.split("\n");
	for(var i = 0; i < arr.length; i++) {
	    var waveParts = arr[i].split(",");
	    var ampl = parseFloat(waveParts[0]);
	    var k = parseFloat(waveParts[1]);
	    var omega = parseFloat(waveParts[2]);
	    var phi = parseFloat(waveParts[3]);
	    var color = waveParts[4];
	    var dir = waveParts[5];
	    if(!isNaN(ampl) && !isNaN(k) && !isNaN(omega) &&
	       !isNaN(phi)) {
		addCustomWave(ampl,k,omega,phi,color,dir);
		refreshWaveDiv();
		refreshResultant();
	    }
	}
    };
    reader.readAsText(file);
});

var exportButton = document.getElementById('export_waves');
var exportArea = document.getElementById('exportArea');
exportButton.addEventListener('click', function() {
    writeExportArea();
});

var writeExportArea = function() {
    if(wavesArray.length>0) {
	var text = '';
	for(var i = 0; i < wavesArray.length; i++) {
	    text = text + wavesArray[i].toString() + '\r\n';
	}
	exportArea.innerHTML = text;
    } else {
	exportArea.innerHTML = 'No waves to export . . .';
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
    });
    return select;
};


createWaveEqn = function(waveObj) {
    var eqn = document.createElement('span');
    //y(x,t) =
    var y_x_t = document.createTextNode('y(x,t) = ');
    eqn.appendChild(y_x_t);
    //[1.00]
    var ampl_span = document.createElement('span');
    waveObj.a_span=ampl_span;
    ampl_span.innerHTML = '1.00';
    waveObj.amp_span=ampl_span;
    eqn.appendChild(ampl_span);
    //sin(
    var sin_txt = document.createTextNode('sin( (2\u03C0/');
    eqn.appendChild(sin_txt);
    
    var lambda_span = document.createElement('span');
    waveObj.lambda_span = lambda_span;
    eqn.appendChild(lambda_span);
    
    //x
    var x_txt = document.createTextNode(') x ');
    eqn.appendChild(x_txt);
    //[-+]
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
    
    var f2_span = document.createElement('span');
    waveObj.f2_span = f2_span;
    eqn.appendChild(f2_span);
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
	    var floatVal = eval(phiInput.value)*Math.PI;
	    waveObj.phi_slider.value=''+floatVal;
	    waveObj.edit(waveObj.amplitude,waveObj.frequency, floatVal, phasorOriginPoint);
	    refreshWaves();
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

    var a_slider = document.createElement('input');
    a_slider.type='range';
    a_slider.className='sliders'; 
    a_slider.min='0';
    a_slider.max='2';
    a_slider.step='0.01';
    a_slider.addEventListener('input', function() {
	waveObj.amplitude=a_slider.value;
	waveObj.a_span.innerHTML=''+a_slider.value;
	waveObj.refresh();
	refreshWaves();
    });
    sliders.appendChild(a_slider);
    waveObj.amp_slider = a_slider;

    var num_frequency_span = document.createElement('span');
    num_frequency_span.innerHTML = 'f';
    sliders.appendChild(num_frequency_span);

    var frequency_slider = document.createElement('input');
    frequency_slider.type='range';
    frequency_slider.className='sliders';
    frequency_slider.min='.5';
    frequency_slider.max='15';
    frequency_slider.step='.001';
    frequency_slider.value=''+waveObj.frequency;

    frequency_slider.addEventListener('input', function() {
	waveObj.frequency = frequency_slider.value;
	console.log(waveObj.frequency);
	var lambda = parseFloat(calculateLambdaFromFrequency(frequency_slider.value)).toFixed(3);
	waveObj.lambda_span.innerHTML = lambda;
	waveObj.f2_span.innerHTML = frequency_slider.value;
	var k = calculateKFromFrequency(frequency_slider.value);
	var omega = calculateOmegaFromK(k);
	waveObj.k = k;
	waveObj.omega = omega;
	waveObj.edit(waveObj.amplitude, frequency_slider.value, waveObj.phi,phasorOriginPoint);
	refreshWaves();
    });


    sliders.appendChild(frequency_slider);
    waveObj.f_slider = frequency_slider;

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

    phi_slider.addEventListener('input', function() {
	var scaleByPi = parseFloat(phi_slider.value) / Math.PI;
	scaleByPi = parseFloat(scaleByPi).toFixed(3);
	waveObj.phi_input.value=''+scaleByPi;
	waveObj.edit(waveObj.amplitude,waveObj.frequency, parseFloat(phi_slider.value,phasorOriginPoint), phasorOriginPoint);
	refreshWaves();
    });


    var space = document.createElement('span');
    space.innerHTML = '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;';
    sliders.appendChild(space);

    var deleteButton = document.createElement('button');
    deleteButton.innerHTML='X';
    waveObj.Xbutton = deleteButton;
    deleteButton.addEventListener('click', function() {
	waveObj.wipe();
	wavesArray.splice(waveObj.arrayIndex,1);
	refreshWaveDiv();
	refreshResultant();
	clearExportArea();
    });
    
    sliders.appendChild(deleteButton);
    return sliders;
};

createWaveDOM = function(waveObj) {
    var wave = document.createElement('div');
    var colorDropdown = createColorDropdown(waveObj);
    var eqn = createWaveEqn(waveObj);
    var newline = document.createElement('span');
    newline.innerHTML='<br>';
    var sliders = createWaveSlidersDOM(waveObj);
    wave.appendChild(colorDropdown);
    wave.appendChild(eqn);
    wave.appendChild(newline);
    wave.appendChild(sliders);
    //Hand the waveObj the necessary reference for color.
    waveObj.color_dropdown = colorDropdown;
    return wave;
};

var disableButtons = function() {
    addWaveButton.disabled = true;
    for(var i = 0; i < wavesArray.length; i++) {
	wavesArray[i].Xbutton.disabled=true;
	//Disable phi.
	wavesArray[i].phi_input.disabled=true;
	wavesArray[i].phi_slider.disabled=true;
    }
};

var enableButtons = function() {
    for(var i = 0; i < wavesArray.length; i++) {
	wavesArray[i].Xbutton.disabled=false;
	//Enable phi.
	wavesArray[i].phi_input.disabled=false;
	wavesArray[i].phi_slider.disabled=false;
    }

};

