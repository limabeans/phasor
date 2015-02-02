var canvas = document.getElementById("waveCanvas");
canvas.width = window.innerWidth/1.03;
canvas.height = window.innerHeight/1.4;

var zeroX = canvas.height;
var zeroY = canvas.height/2;
var oneWavelength = (canvas.width - zeroX)/2
console.log('zeroX' , zeroX);
console.log('wavelength', zeroX+oneWavelength);
var maxAmpl = 2;

var sin = new Path({ strokeColor: 'blue'});

for(var i = 0; i <= 100; i++) {
    var sinStep = (2*Math.PI)/100;
    var sinVar = sinStep * i;
    var pixelVar = (oneWavelength / 100)*i;
    var height = canvas.height/2;
    sin.add(new Point(zeroX+pixelVar, zeroY - (height/maxAmpl)*Math.sin(sinVar)));
}

var origin = new Path.Circle({
    center:[zeroX,zeroY],
    radius: 20,
    strokeColor: 'black'
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
    strokeColor: 'black'
});
var midwayLine = new Path.Line({
    from: [canvas.height,zeroY],
    to: [canvas.width, zeroY],
    strokeColor: 'black'
});


function Person(n,a) {
    this.name = n;
    this.age = a;
};

