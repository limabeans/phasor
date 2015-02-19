//Global variables.
var canvas = document.getElementById("waveCanvas");
//canvas.width = window.innerWidth/1.03;
//canvas.height = window.innerHeight/1.4;
var zeroX = canvas.height;
var zeroY = canvas.height/2;
var pixelWavelength = (canvas.width - zeroX);
var maxAmpl = 2;
var maxHeight = canvas.height/2;
var wavelength = pixelWavelength/maxHeight;
var pointsPerWave = 100;
var phasorOriginPoint = new Point(zeroX/2,zeroY);
var velocityOfMedium = 10;
var timeStep = 0.01;
var reverseFlag=false;
var play=false;

function Wave(a,k,omega,phi,color,d) {
    this.a = a;
    this.k = k;
    this.omega = omega;
    this.phi = phi;
    this.w=1;
    this.color = color;
    this.dir=d;
    this.path = new Path({strokeColor: this.color, strokeWidth:1});
    this.phasor = new Group();

    this.edit=function(amplSliderVal, wavelengthSliderVal,phiSliderVal) {
	this.a = amplSliderVal;
	this.w = wavelengthSliderVal;
	this.phi = phiSliderVal;
	
	this.k=2*Math.PI/this.w;
	this.omega=velocityOfMedium*this.k;
	
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
	var deltaY=scaledHeight*this.a*Math.sin(this.phi);
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

    //Draw initial wave.
    this.edit(this.a,this.w,this.phi);
    this.editPhasor();

};

var wave1 = new Wave(1,0,0,0,'blue','-');

function onMouseDrag(event) {
    console.log('drag');
};

function onMouseUp(event) {
    console.log('up');
};

function onMouseDown(event) {
    console.log('down');
};

//Draw lines
// var origin = new Path.Circle({
//     center:[zeroX,zeroY],
//     radius: 20,
//     strokeColor: 'purple'
// });

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

var amplSlider = document.getElementById('amplitude');
amplSlider.addEventListener('input', function() {
    //Editing numerical label here.
    document.getElementById('wave_amp').innerHTML=''+amplSlider.value;
    //Editing the actual wave that the user sees.
    var sliderVal = parseFloat(amplSlider.value);
    wave1.edit(sliderVal,wave1.w,wave1.phi,wave1.dir);
});


var wavelengthSlider = document.getElementById('wavelength');
wavelengthSlider.addEventListener('input', function() {
    var sliderVal = parseFloat(wavelengthSlider.value);
    var k = 2*Math.PI/sliderVal;
    k = parseFloat(k).toFixed(2);
    var w = 2*Math.PI*velocityOfMedium/sliderVal;
    w = parseFloat(w).toFixed(2);
    document.getElementById('wave_k').innerHTML=''+k;
    document.getElementById('wave_w').innerHTML=''+w;

    wave1.edit(wave1.a, sliderVal, wave1.phi, wave1.dir);
});

var phiSlider = document.getElementById('phi');
phiSlider.addEventListener('input', function() {
    var sliderVal = parseFloat(phiSlider.value);
    var wave_phi = document.getElementById('wave_phi');
    wave_phi.innerHTML= ''+sliderVal;
    wave1.edit(wave1.a, wave1.w, sliderVal, wave1.dir);

});


function onFrame(event) {
    if(play) {
	//Checking if the dropdown button is + or -
	if(wave1.dir === '-') {
	    wave1.phi-=timeStep;
	} else { //wave1.dir === '+'
	    wave1.phi+=timeStep;
	}
	
	wave1.edit(wave1.a,wave1.w,wave1.phi);
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
    var scaled = parseFloat(speedVal*10).toFixed(1);
    speed_val.innerHTML=''+scaled;
    speedVal = parseFloat(speedVal);
    timeStep=speedVal;
    
});
//var cc = new Path.Circle(view.center, 3); cc.strokeColor='green';

var directionDropdown = document.getElementById('dir');
console.log(directionDropdown);
directionDropdown.addEventListener('change', function() {
    reverseFlag=!reverseFlag;

    if(wave1.dir==='-') {
	wave1.dir='+';
    } else {
	wave1.dir='-';
    }
});


var colorDropdown = document.getElementById('color');
colorDropdown.addEventListener('change', function() {
    wave1.color = colorDropdown.value;
    wave1.refresh();
});

var testfunc = function() {
    this.value = 'rekt';
};

var createColorDropdown = function() {
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
	alert(this.value);
    });
    return select;
};

var createWaveEqn = function() {
    //[color] y(x,t)=[1.00]sin([6.28]x [-+] [62.83]t + [0])
    var eqn = document.createElement('span');
    //y(x,t) =
    var y_x_t = document.createTextNode('y(x,t) = ');
    eqn.appendChild(y_x_t);
    //[1.00]
    var ampl_span = document.createElement('span');
    ampl_span.innerHTML = '1.00';
    eqn.appendChild(ampl_span);
    //sin(
    var sin_txt = document.createTextNode('sin(');
    eqn.appendChild(sin_txt);
    //[6.28]
    var k_span = document.createElement('span');
    k_span.innerHTML='6.28';
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
    eqn.appendChild(dir_dropdown);
    //[62.83]
    var omega_span = document.createElement('span');
    omega_span.innerHTML='62.83';
    eqn.appendChild(omega_span);
    //t +
    var t_plus_txt = document.createTextNode('t + ');
    eqn.appendChild(t_plus_txt);
    //[0]
    var phi_span = document.createElement('span');
    phi_span.innerHTML = '0';
    eqn.appendChild(phi_span);
    //)
    var end_paren_txt = document.createTextNode(')');
    eqn.appendChild(end_paren_txt);
    return eqn;
};

var createWaveDOM = function() {
    var wave = document.createElement('div');
    var colorDropdown = createColorDropdown();
    var eqn = createWaveEqn();
    wave.appendChild(colorDropdown);
    wave.appendChild(eqn);
    return wave;
};

var count = 0;
var testzone = document.getElementById('testzone');
var testbutton = document.getElementById('testbutton');
testbutton.addEventListener('click', function() {
    var node = createWaveDOM();
    testzone.appendChild(node);
});
