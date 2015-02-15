console.log('ran code.js');
//Global variables.
var canvas = document.getElementById("waveCanvas");
canvas.width = window.innerWidth/1.03;
canvas.height = window.innerHeight/1.4;
var zeroX = canvas.height;
var zeroY = canvas.height/2;
var oneWavelength = (canvas.width - zeroX);
var maxAmpl = 2;
var maxHeight = canvas.height/2;
var pointsPerWave = 100;

function Wave(a,k,omega,phi,color) {
    this.a = a;
    this.k = k;
    this.omega = omega;
    this.phi = phi;
    this.color = color;
    this.path = new Path({strokeColor: this.color});
    
    this.editAmplitude=function(sliderVal) {
	this.path.removeSegments();
	for(var i = 0; i <= pointsPerWave; i++) {
	    var scaleFraction = i/pointsPerWave;
	    var deltaX = scaleFraction*oneWavelength;
	    var sinInput = scaleFraction*(2*Math.PI);
	    var scaledHeight = maxHeight/maxAmpl;
	    var deltaY=sliderVal*scaledHeight*Math.sin(sinInput);
	    this.path.add(new Point(zeroX+deltaX,zeroY-deltaY));
	}
	this.path.smooth();
    };
    
    //Draw initial wave.
    this.editAmplitude(1);

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

var scaleVector = new Point({
    angle: 45,
    length: (oneWavelength/8)*Math.sqrt(2)
});


//Draw lines
var origin = new Path.Circle({
    center:[zeroX,zeroY],
    radius: 20,
    strokeColor: 'purple'
});

var amplTick = new Path.Line({
    from:[zeroX-10, zeroY - (canvas.height/2)/maxAmpl],
    to:[zeroX+10, zeroY - (canvas.height/2)/maxAmpl],
    strokeColor: 'green'
});

var wavelengthTick = new Path.Line({
    from: [zeroX + oneWavelength/2, -10 + zeroY],
    to: [zeroX + oneWavelength/2 ,10 + zeroY],
    strokeColor: 'red'
    
});
var phasorXaxis = new Path.Line({
    from: [0, zeroY],
    to: [canvas.height, zeroY],
    strokeColor: 'blue'
});
var phasorYaxis = new Path.Line({
    from: [zeroX/2,0],
    to: [zeroX/2,canvas.height],
    strokeColor: 'blue'
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
    document.getElementById('num').innerHTML=''+amplSlider.value;

    var sliderVal = parseFloat(amplSlider.value);
    wave1.editAmplitude(sliderVal);
});


var phiSlider = document.getElementById('phi');
phiSlider.addEventListener('input', function() {
    document.getElementById('num4').innerHTML=''+phiSlider.value;
    var val = parseFloat(phiSlider.value);

    var phiInterval = (oneWavelength)/(1000);
    sin.translate([phiInterval,0]);
    // for(var i=0; i<=100; i++) {
    // 	var pt=sin.segments[i].point;
    // 	pt.x+=phiInterval;
    // }

});


function onFrame(event) {

};

