//Global variables.
var canvas = document.getElementById("waveCanvas");
//canvas.width = window.innerWidth/1.03;
//canvas.height = window.innerHeight/1.4;
var zeroX = canvas.height;
var zeroY = canvas.height/2;
var pixelWavelength = (canvas.width - zeroX);
var maxAmpl = 2;
var maxHeight = canvas.height/2;
//wavelength = ratio of y_max/w_max
var wavelength = pixelWavelength/maxHeight;
var maxWavelength = wavelength*maxAmpl;
var pointsPerWave = 100;
var phasorOriginPoint = new Point(zeroX/2,zeroY);
var velocityOfMedium = 10;
var timeStep = 0.0001;
var play=false;
var wavesArray=[];

var addWaveButton = document.getElementById('add_wave');
var waveEquationsDiv = document.getElementById('adder');
addWaveButton.addEventListener('click', function() {
    var k = Math.PI*2/1;
    var w = Math.PI*2*velocityOfMedium/1;
    wavesArray.push(new Wave(1,k,w,0,'blue','-'));
    refreshWaveDiv();
});

var refreshWaveDiv = function() {
    //Clear it up.
    while (waveEquationsDiv.hasChildNodes()) {
	waveEquationsDiv.removeChild(waveEquationsDiv.lastChild);
    }
    for(var i = 0; i < wavesArray.length; i++) {
	waveEquationsDiv.appendChild(wavesArray[i].waveDOM);
    }
};

function Wave(a,k,omega,phi,color,d) {
    this.a = a;
    this.a_span = null;
    this.lambda = maxWavelength / 1;
    this.k_span = null;
    this.omega = Math.PI*2*velocityOfMedium/1;
    this.omega_span = null;
    this.phi = phi;
    this.phi_span = null;
    this.w=1;
    this.color = color;
    this.dir=d;
    this.path = new Path({strokeColor: this.color, strokeWidth:1});
    this.phasor = new Group();
    this.dX=0;
    this.dY=0;

    this.edit=function(amplSliderVal, wavelengthSliderVal,phiSliderVal) {
	this.a = amplSliderVal;
	this.w = wavelengthSliderVal;
	this.phi = phiSliderVal;
	
	
	this.path.removeSegments();
	for(var i = 0; i <= pointsPerWave; i++) {
	    var scaleFraction = i/pointsPerWave;
	    var deltaX = scaleFraction*pixelWavelength;
	    //Scaling on the fraction to find out "where I am" on the
	    // wavelength, and then finding out where I am on the 2pi
	    //unit circle.
	    var sinInput = this.w*scaleFraction*(2*Math.PI);
	    var scaledHeight = maxHeight/maxAmpl;
	    var deltaY=this.a*scaledHeight*Math.sin(sinInput+this.phi);
	    this.path.add(new Point(zeroX+deltaX,zeroY-deltaY));

	}
	this.path.smooth();
	this.editPhasor();
    };
    this.editPhasor=function() {
	this.phasor.remove();
	var line = new Path();
	var scaledHeight = maxHeight/maxAmpl;
	var deltaX=scaledHeight*this.a*Math.cos(this.phi);
	this.dX=deltaX;
	var deltaY=scaledHeight*this.a*Math.sin(this.phi);
	this.dY=deltaY;
	var offset = new Point(phasorOriginPoint.x+deltaX,
			       phasorOriginPoint.y-deltaY);
	
	line.add(phasorOriginPoint);
	line.add(offset);
	var arrowVector = (offset-phasorOriginPoint).normalize(10);
	this.phasor = new Group([
	    line,
	    new Path([
		offset+arrowVector.rotate(-135),
		offset,
		offset+arrowVector.rotate(135)
	    ])
	]);
	this.phasor.strokeColor=this.color;
	this.phasor.strokeWidth=2;
    };
    
    this.refresh = function() {
	this.path.remove();
    	this.path = new Path({strokeColor: this.color, strokeWidth:1});
	this.phasor.remove();
    	this.phasor=new Group();
    	this.edit(this.a, this.w, this.phi);
    };


    this.createColorDropdown = function(waveObj) {
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

    this.createWaveEqn = function(waveObj) {
	//[color] y(x,t)=[1.00]sin([6.28]x [-+] [62.83]t + [0])
	var eqn = document.createElement('span');
	//y(x,t) =
	var y_x_t = document.createTextNode('y(x,t) = ');
	eqn.appendChild(y_x_t);
	//[1.00]
	var ampl_span = document.createElement('span');
	waveObj.a_span=ampl_span;
	ampl_span.innerHTML = '1.00';
	eqn.appendChild(ampl_span);
	//sin(
	var sin_txt = document.createTextNode('sin(');
	eqn.appendChild(sin_txt);
	//[6.28]
	var k_span = document.createElement('span');
	k_span.innerHTML='6.28';
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
	var phi_span = document.createElement('span');
	phi_span.innerHTML = '0';
	waveObj.phi_span=phi_span;
	eqn.appendChild(phi_span);
	//)
	var end_paren_txt = document.createTextNode(')');
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
	    waveObj.a=a_slider.value;
	    waveObj.a_span.innerHTML=''+a_slider.value;
	    waveObj.refresh();
	});
	sliders.appendChild(a_slider);

	var num_wavelengths = document.createElement('span');
	num_wavelengths.innerHTML = 'f';
	sliders.appendChild(num_wavelengths);

	var num_wavelengths_slider = document.createElement('input');
	num_wavelengths_slider.type='range';
	num_wavelengths_slider.className='sliders';
	num_wavelengths_slider.min='.5';
	num_wavelengths_slider.max='10';
	num_wavelengths_slider.step='.1';
	num_wavelengths_slider.value='1';
	num_wavelengths_slider.addEventListener('input', function() {
	    waveObj.lambda = maxWavelength/num_wavelengths_slider.value;
	    var k_tmp = 2*Math.PI/waveObj.lambda;
	    waveObj.k_span.innerHTML=''+parseFloat(k_tmp).toFixed(2);
	    var omega_tmp = 2*Math.PI*velocityOfMedium/waveObj.lambda;
	    waveObj.omega=omega_tmp; //I actually changed omega value here.
	    waveObj.omega_span.innerHTML=''+parseFloat(omega_tmp).toFixed(2);
	    waveObj.edit(waveObj.a, num_wavelengths_slider.value, waveObj.phi);
	});
	sliders.appendChild(num_wavelengths_slider);

	var phi = document.createElement('span');
	phi.innerHTML='&phi;';
	sliders.appendChild(phi);

	var phi_slider = document.createElement('input');
	phi_slider.type='range';
	phi_slider.className='sliders';
	phi_slider.min='-6.283';
	phi_slider.max='6.283';
	phi_slider.step='0.01';
	phi_slider.value='0';
	sliders.appendChild(phi_slider);
	phi_slider.addEventListener('input', function() {
	    waveObj.phi_span.innerHTML=''+phi_slider.value;
	    waveObj.edit(waveObj.a,waveObj.w, parseFloat(phi_slider.value));
	});
	return sliders;
    };


    this.createWaveDOM = function() {
	var wave = document.createElement('div');
	var colorDropdown = this.createColorDropdown(this);
	var eqn = this.createWaveEqn(this);
	var newline = document.createElement('span');
	newline.innerHTML='<br>';
	var sliders = this.createWaveSlidersDOM(this);
	wave.appendChild(colorDropdown);
	wave.appendChild(eqn);
	wave.appendChild(newline);
	wave.appendChild(sliders);
	return wave;
    };


    //Draw initial wave.
    this.edit(this.a,this.w,this.phi);
    this.editPhasor();
    this.waveDOM = this.createWaveDOM();
    //waveEquationsDiv.appendChild(this.waveDOM);

};

//var wave1 = new Wave(1,0,0,0,'blue','-');

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

var resultantWave = new Path({strokeColor:'black', strokeWidth:3});
var resultantPhasor = new Path({strokeColor: 'black', strokeWidth:3});

function onFrame(event) {
    if(play) {
	//This iterates through the wavesArray and dynamically updates/redraws 
	//all of the waves onto the screen.
	for(var i = 0; i <wavesArray.length; i++) {
	    var omega = parseFloat(wavesArray[i].omega);
	    if(wavesArray[i].dir==='-') {
		wavesArray[i].phi -= omega*timeStep;
		wavesArray[i].edit(wavesArray[i].a,
				   wavesArray[i].w,wavesArray[i].phi);
	    } else {
		wavesArray[i].phi += omega*timeStep;
		wavesArray[i].edit(wavesArray[i].a,
				   wavesArray[i].w,wavesArray[i].phi);
	    }
	}
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
	resultantPhasor.removeSegments();
	resultantPhasor.add(phasorOriginPoint);
	var resultant_dX=0;
	var resultant_dY=0;
	for(var i=0; i < wavesArray.length; i++) {
	    resultant_dX+=wavesArray[i].dX;
	    resultant_dY-=wavesArray[i].dY;
	}
	var resultant_dot = phasorOriginPoint
	    +(new Point(resultant_dX, resultant_dY));
	resultantPhasor.add(resultant_dot);
    }
};

var playButton = document.getElementById('play');
playButton.addEventListener('click', function() {
    play=!play;
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
    console.log(speedVal);
    var scaled = parseFloat(speedVal*1000).toFixed(1);
    speed_val.innerHTML=''+scaled;
    speedVal = parseFloat(speedVal);
    timeStep=speedVal;
    
});

