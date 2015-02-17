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

function Wave(a,k,omega,phi,color) {
    this.a = a;
    this.k = k;
    this.omega = omega;
    this.phi = phi;
    this.w=1;
    this.color = color;
    this.path = new Path({strokeColor: this.color, strokeWidth:1});
    this.phasor = new Group();
    this.edit=function(amplSliderVal, wavelengthSliderVal,phiSliderVal) {
	this.a = amplSliderVal;
	this.w = wavelengthSliderVal;
	this.phi = phiSliderVal;
	this.path.removeSegments();
	for(var i = 0; i <= pointsPerWave; i++) {
	    var scaleFraction = i/pointsPerWave;
	    var deltaX = scaleFraction*pixelWavelength;
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
	this.phasor.strokeColor='blue';
	this.phasor.strokeWidth=2;
    };
    //Draw initial wave.
    this.edit(this.a,this.w,this.phi);
    this.editPhasor();

};

var wave1 = new Wave(1,0,0,0,'blue');

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
    document.getElementById('num').innerHTML=''+amplSlider.value;
    document.getElementById('wave_amp').innerHTML=''+amplSlider.value;
    //Editing the actual wave that the user sees.
    var sliderVal = parseFloat(amplSlider.value);
    wave1.edit(sliderVal,wave1.w,wave1.phi);
});


var wavelengthSlider = document.getElementById('wavelength');
wavelengthSlider.addEventListener('input', function() {
    document.getElementById('num2').innerHTML=''+wavelengthSlider.value;
    var sliderVal = parseFloat(wavelengthSlider.value);
    var k = 2*Math.PI/sliderVal;
    k = parseFloat(k).toFixed(2);
    var w = 2*Math.PI*velocityOfMedium/sliderVal;
    w = parseFloat(w).toFixed(2);
    document.getElementById('wave_k').innerHTML=''+k;
    document.getElementById('wave_w').innerHTML=''+w;
    document.getElementById('wave_k2').innerHTML=''+k;
    document.getElementById('wave_w2').innerHTML=''+w;

    wave1.edit(wave1.a, sliderVal, wave1.phi);
});

// var kSlider = document.getElementById('k');
// kSlider.addEventListener('input', function() {
//     document.getElementById('num2').innerHTML=''+kSlider.value;
//     var sliderVal = parseFloat(kSlider.value);
// });
// document.getElementById('pixelWavelength').innerHTML=''+wavelength;

var phiSlider = document.getElementById('phi');
phiSlider.addEventListener('input', function() {
    document.getElementById('num4').innerHTML=''+phiSlider.value;
    document.getElementById('wave_phi').innerHTML=''+phiSlider.value;
    var sliderVal = parseFloat(phiSlider.value);
    wave1.edit(wave1.a, wave1.w, sliderVal);

});


function onFrame(event) {

};

//var cc = new Path.Circle(view.center, 3); cc.strokeColor='green';

