console.log('ran code.js');
//Global variables.
var canvas = document.getElementById("waveCanvas");
canvas.width = window.innerWidth/1.03;
canvas.height = window.innerHeight/1.4;
var zeroX = canvas.height;
var zeroY = canvas.height/2;
var oneWavelength = (canvas.width - zeroX)/2;
var maxAmpl = 2;
var maxHeight = canvas.height/2;


var sin = new Path({ strokeColor: 'blue'});

for(var i = 0; i <= 100; i++) {
    var sinStep = (2*Math.PI)/100;
    var sinVar = sinStep * i;
    var pixelVar = (oneWavelength / 100)*i;
    var height = canvas.height/2;
    sin.add(new Point(zeroX+pixelVar, zeroY - (height/maxAmpl)*Math.sin(sinVar)));
}

function Wave(a,k,omega,phi,color) {
    this.a = a;
    this.k = k;
    this.omega = omega;
    this.phi = phi;
    this.color = color;
    
};


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
    length: (oneWavelength/4)*Math.sqrt(2)
});

var sinPath = new Path({strokeColor: 'green'});
sinPath.segments = [
    [[zeroX,zeroY],null,scaleVector.rotate(-90)],
    [[zeroX+oneWavelength/2,zeroY], scaleVector.rotate(-180),scaleVector],
    [[zeroX+oneWavelength,zeroY],scaleVector.rotate(90),null]
];
//sinPath.fullySelected=true;


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
    from: [zeroX + oneWavelength, -10 + zeroY],
    to: [zeroX + oneWavelength ,10 + zeroY],
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
console.log(amplSlider);
amplSlider.addEventListener('input', function() {
    document.getElementById('num').innerHTML=''+amplSlider.value;

    var val = parseFloat(amplSlider.value);
//    view.on('frame', function() {
    for (var i = 0; i < 2; i++) {
	var curve = sinPath.curves[i];
	curve.handle1.y=curve.handle2.y= val*canvas.height/4*(i%2 ? 1: -1);
    }
    sin.removeSegments();
    for(var i = 0; i <= 100; i++) {
	var sinStep = (2*Math.PI)/100;
	var sinVar = sinStep * i;
	var pixelVar = (oneWavelength / 100)*i;
	var height = canvas.height/2;
	sin.add(new Point(zeroX+pixelVar, zeroY - val*(height/maxAmpl)*Math.sin(sinVar)));
    }

});

function onFrame(event) {

};

console.log(sin);
