//Global variables.
var canvas = document.getElementById("waveCanvas");
//canvas.width = window.innerWidth/1.03;
//canvas.height = window.innerHeight/1.4;
var zeroX = canvas.height;
var zeroY = canvas.height/2;
var pixelWavelength = (canvas.width - zeroX);
var maxAmpl = 2;
//maxHeight is in pixels as well.
var maxHeight = canvas.height/2;
//wavelength = ratio of y_max/w_max
var wavelength = pixelWavelength/maxHeight;

//And so maxWavelength is now scaled by whatever 
//maxAmpl is, which is currently set to 2.
//So technically, in this ficticious scaled universe,
//your wavelength can be never be no longer than 4.66.
var maxWavelength = wavelength*maxAmpl;
console.log(maxWavelength);
var pointsPerWave = 100;
var phasorOriginPoint = new Point(zeroX/2,zeroY);
var velocityOfMedium = 10;
var currentTime=0;
var timeStep = 0.001;
var play=false;
var wavesArray=[];
var tails_at_origin=true;
var resultantWave = new Path({strokeColor:'black', strokeWidth:3});
var resultantPhasor = new Group({strokeColor: 'black', strokeWidth:3});
var showIndividual=true;
var showResultant=true;

var setIntervalInitialized=false;
var setIntervalVariable = null;

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
	wavesArray[i].refreshWaveDOM();
	td.appendChild(wavesArray[i].waveDOM);
	tbody.appendChild(tr);
	//Regenerating the array index of every wave.
	wavesArray[i].arrayIndex=i;
    }
    console.log(tableRef);
};

function Wave(a,k,omega,phi,color,d) {
    this.color_dropdown = null;
    this.amp_span = null;
    this.k_span = null;
    this.dir_dropdown = null;
    this.omega_span = null;
    this.phi_input = null;

    this.amp_slider = null;
    this.f_slider = null;
    this.phi_slider = null;

    this.arrayIndex=-1;
    this.amplitude = a;
    this.lambda = maxWavelength / 1;
    //this.k = 2*Math.PI / this.lambda;
    this.k = k;
    
    this.omega=omega;

    this.phiTimeDelta=0;
    this.phi = phi;
    this.frequency=1;
    this.color = color;
    this.dir=d;
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
    

    this.edit=function(amplSliderVal, wavelengthSliderVal,phiSliderVal,pseudoOrigin) {
	this.amplitude = amplSliderVal;
	this.frequency = wavelengthSliderVal;
	this.phi = phiSliderVal;
	
	this.path.removeSegments();
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
	console.log(this.toString());
    };
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
    
    this.refresh = function() {
	this.path.remove();
    	this.path = new Path({strokeColor: this.color, strokeWidth:1});
	this.phasor.remove();
    	this.phasor=new Group();
    	this.edit(this.amplitude, this.frequency, this.phi,phasorOriginPoint);
    };



    this.createWaveEqn = function(waveObj) {
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
	var sin_txt = document.createTextNode('sin(');
	eqn.appendChild(sin_txt);
	//[6.28]
	var k_span = document.createElement('span');
	//k_span.innerHTML='6.28';
	k_span.innerHTML=parseFloat(waveObj.k).toFixed(3);
	waveObj.k_span = k_span;
	eqn.appendChild(k_span);
	//x
	var x_txt = document.createTextNode('x ');
	eqn.appendChild(x_txt);
	//[-+]
	var dir_dropdown = document.createElement('select');
	var minus = document.createElement('option');
	minus.text='-'; minus.value='-';
	dir_dropdown.add(minus);
	var plus = document.createElement('option');
	plus.text='+'; plus.value='+';
	dir_dropdown.add(plus);
	dir_dropdown.addEventListener('change', function() {
	    waveObj.dir=dir_dropdown.value;
	});
	eqn.appendChild(dir_dropdown);
	//[62.83]
	var omega_span = document.createElement('span');
	omega_span.innerHTML='62.83';
	waveObj.omega_span=omega_span;
	//NaN bug here???
	//waveObj.omega=omega_span.value;
	eqn.appendChild(omega_span);
	//t +
	var t_plus_txt = document.createTextNode('t + ');
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
	    }
	});

	//pi)
	var end_paren_txt = document.createTextNode('\u03C0)');
	eqn.appendChild(end_paren_txt);
	
	return eqn;
    };

    this.createWaveSlidersDOM = function(waveObj) {
	var sliders = document.createElement('span');
	var alpha = document.createElement('span');
	alpha.innerHTML='&alpha;';
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
	});
	sliders.appendChild(a_slider);
	waveObj.amp_slider = a_slider;

	var num_wavelengths = document.createElement('span');
	num_wavelengths.innerHTML = 'f';
	sliders.appendChild(num_wavelengths);

	var frequency_slider = document.createElement('input');
	frequency_slider.type='range';
	frequency_slider.className='sliders';
	frequency_slider.min='.5';
	frequency_slider.max='10';
	frequency_slider.step='.1';
	frequency_slider.value='1';
	frequency_slider.addEventListener('input', function() {
	    waveObj.lambda = maxWavelength/frequency_slider.value;
	    var k_tmp = 2*Math.PI/waveObj.lambda;
	    waveObj.k_span.innerHTML=''+parseFloat(k_tmp).toFixed(2);
	    var omega_tmp = 2*Math.PI*velocityOfMedium/waveObj.lambda;
	    waveObj.omega=omega_tmp; //I actually changed omega value here.
	    waveObj.omega_span.innerHTML=''+parseFloat(omega_tmp).toFixed(2);
	    waveObj.edit(waveObj.amplitude, frequency_slider.value, waveObj.phi,phasorOriginPoint);
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
	});
	return sliders;
    };


    this.createWaveDOM = function(waveObj) {
	var wave = document.createElement('div');
	

	var colorDropdown = createColorDropdown(this);
	var eqn = this.createWaveEqn(this);
	var newline = document.createElement('span');

	var deleteButton = document.createElement('button');
	deleteButton.innerHTML='X';
	deleteButton.addEventListener('click', function() {
	    waveObj.wipe();
	    wavesArray.splice(waveObj.arrayIndex,1);
	    refreshWaveDiv();
	    refreshResultant();
	    clearExportArea();
	});

	newline.innerHTML='<br>';
	var sliders = this.createWaveSlidersDOM(this);
	wave.appendChild(colorDropdown);
	wave.appendChild(eqn);

	wave.appendChild(deleteButton);

	wave.appendChild(newline);
	wave.appendChild(sliders);
	return wave;
    };
    
    this.refreshWaveDOM = function() {
	this.amp_span.innerHTML = this.amplitude;
	//this.k_span.innerHTML = this.k;
	this.omega_span.innerHTML = parseFloat(this.omega).toFixed(3);
	this.amp_slider.value = this.amplitude;
	//this.f_slider.value = this.frequency;
	var phi_scaled = this.phi / Math.PI;
	this.phi_input.value = phi_scaled;
	this.phi_slider.value = this.phi;
    };
    


    //Draw initial wave.
    this.edit(this.amplitude,this.frequency,this.phi,phasorOriginPoint);
    this.waveDOM = this.createWaveDOM(this);
    
    this.toString = function() {
	var str = ''+this.amplitude+','+this.k_span.innerHTML+','+this.omega+','+this.phi+','+this.color+','+this.dir;
	return str;
    };

    console.log(this.toString());

};

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


function onFrame(event) {
    if(play) {
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

    }
};

refreshWaves = function() {
    console.log('refresh');
    //This iterates through the wavesArray and dynamically updates/redraws 
    //all of the waves onto the screen.
    for(var i = 0; i <wavesArray.length; i++) {
	console.log('before anything happens'+wavesArray[i].toString());
	var omega = parseFloat(wavesArray[i].omega);
	if(wavesArray[i].dir==='-') {
	    wavesArray[i].phiTimeDelta -= omega*timeStep;
	} else {
	    wavesArray[i].phiTimeDelta += omega*timeStep;
	}
	console.log('plus some stuff'+wavesArray[i].toString());
	if(showIndividual) {
	    wavesArray[i].setVisible();
	} else {
	    wavesArray[i].setInvisible();
	}
	console.log('3hasd'+wavesArray[i].toString());
	//This is the part where we actually draw to the screen.
	//How we edit the waves depends on whether we want the phasors to be 
	//all tails at origin, or vector added.
	//We won't see anything on the screen, however, if the individual waves were set to invisible.
	if(tails_at_origin) {
	    wavesArray[i].edit(wavesArray[i].amplitude,
			       wavesArray[i].frequency,wavesArray[i].phi,phasorOriginPoint);
	    console.log('4kZJ'+wavesArray[i].toString());
	} else {
	    if(i==0) {
		//The first phasor should really be at the origin.
		wavesArray[i].edit(wavesArray[i].a,
				   wavesArray[i].w,wavesArray[i].phi,phasorOriginPoint);
	    } else {
		wavesArray[i].edit(wavesArray[i].a,
				   wavesArray[i].w,wavesArray[i].phi,wavesArray[i-1].offsetPoint);
	    }
	}
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

var speedSlider = document.getElementById('speed');
var speed_val = document.getElementById('speed_val');
speedSlider.addEventListener('input', function() {
    var speedVal = speedSlider.value;
    var scaled = parseFloat(speedVal).toFixed(1);
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


var clearButton = document.getElementById('clear');

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
};


var clearExportArea = function() {
    exportArea.innerHTML = '';    
};
clearButton.addEventListener('click', function() {
    clearEverything();
});

var deleteResultant = function() {
    resultantWave.removeSegments();
    resultantPhasor.remove();
};

var resetButton = document.getElementById('reset');
resetButton.addEventListener('click', function() {
    for(var i=0; i<wavesArray.length; i++) {
	wavesArray[i].reset();
    }
    deleteResultant();
    resetPlayButton();
    resetTimeElapsed();
    refreshResultant();
    clearExportArea();
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


var refreshResultant = function() {
    //resultantWave
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
};



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
	console.log(arr);
	for(var i = 0; i < arr.length; i++) {
	    var waveParts = arr[i].split(",");
	    console.log(waveParts);
	    var a = parseFloat(waveParts[0]);
	    var k = parseFloat(waveParts[1]);
	    var w = parseFloat(waveParts[2]);
	    var p = parseFloat(waveParts[3]);
	    var color = waveParts[4];
	    var dir = waveParts[5];
	    if(!isNaN(a) && !isNaN(k) && !isNaN(w) &&
	       !isNaN(p)) {
		addCustomWave(a,k,w,p,color,dir);
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

var addWaveButton = document.getElementById('add_wave');
addWaveButton.addEventListener('click', function() {
    addWave();
});

var addWave = function() {
    if(wavesArray.length<5) {
	//var k = Math.PI*2/1;
	var k = Math.PI*2/maxWavelength;
	//"Drifting" bug fixed here. 
	//Divide by maxWavelength rather than by 1.
	//here, w is definitely omega.
	//maxWavelength is definitely the largest wavelength
	//in the ficticious world, which is what is to be expected,
	//because the default is to have the wave only have
	//one wavelength across the page.
	var w = Math.PI*2*velocityOfMedium/maxWavelength;
	console.log('w'+w);
	console.log(velocityOfMedium);
	console.log(maxWavelength);
	console.log(w);
	wavesArray.push(new Wave(1,k,w,0,'blue','-'));
	refreshWaveDiv();
	if(showResultant) {
	    refreshResultant();
	}
    }
};

var addCustomWave = function(a,k,w,p,color,dir) {
    if(wavesArray.length<5) {
	wavesArray.push(new Wave(a,k,w,p,color,dir));
	refreshWaveDiv();
	if(showResultant) {
	    refreshResultant();
	}
    }
};

createColorDropdown = function(waveObj) {
    var select = document.createElement('select');
    var blue = document.createElement('option');
    blue.text='Blue';
    blue.value='blue';
    var green = document.createElement('option');
    green.text='Green';
    green.value='green';
    var red = document.createElement('option');
    red.text='Red';
    red.value='red';
    var orange = document.createElement('option');
    orange.text='Orange';
    orange.value='orange';
    var purple = document.createElement('option');
    purple.text='Purple';
    purple.value='purple';
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
