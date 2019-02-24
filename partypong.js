/** Thanks to https://codepen.io/ZachSaucier/pen/bBJmbz for the starter code! **/





/** CONSTANTS **/

const kNumBars = 1024; //number of bars the sound is decomposed to
const kBassBars = 10; //first n bars that are considered bass
const kBassMin = .7; //minimum percentage the bass bars need to be before triggering bass effect
const kBassMax = .95;
const kBarMax = 255; //maximum value that a bar can reach
const kSoundVolume = 0.5;

const kBallDiameter = 25;
const kBallSpeed = 5;
const kMaxBallSpeedBonus = 17;

const kPlayerHeight = 140;
const kPlayerWidth = 13;
const kPlayerX = 75;
const kPlayerSpeed = 7;
const kMaxPlayerSpeedBonus = 5;
//const kMaxPlayerYVibration = 12;
//const kMaxPlayerXVibration = 5;
//const kMaxPlayerYShrink = 20;

const kScreenWidth = 1200;
const kScreenHeight = 800;
const kEdgeHeight = 50;
const kEdgeBonus = 50;
const kMaxEdgeDisplacement = 100; //how much the edges of the stage will be displaced at max bass effect
//const kMaxEdgeVibration = 15;

const kBackgroundGradientMax = 10000;
const kBackgroundGradientDifference = 1300;
const kBackgroundGradientSpeed = 3;
const kMaxBackgroundGradientSpeedBoost = 100;

const kBlackValue = 30;
var kFill = "rgb("+kBlackValue+","+kBlackValue+","+kBlackValue+")";

// const kMaxEdgeVibration = 15;
// const kMaxPlayerYVibration = 12;
// const kMaxPlayerXVibration = 5;
//const kMaxPlayerYShrink = 20;
// const kMaxEdgeVibration = 0;
// const kMaxPlayerYVibration = 0;
// const kMaxPlayerXVibration = 0;
//const kMaxPlayerYShrink = 20;
const kMaxEdgeVibration = 15;
const kMaxPlayerYVibration = 12;
const kMaxPlayerXVibration = 5;
const kMaxPlayerYShrink = 20;

/** GLOBAL VARIABLES **/

var canvas;
var fft;
var song;
var loader;

var soundVolume = 0.5;

var player1X;
var player1Y = (kScreenHeight-kPlayerHeight)/2;
var player1Direction = 0;
var player1Y;
var player2Y = (kScreenHeight-kPlayerHeight)/2;
var player2Direction = 0;
var playerHeight = kPlayerHeight;

var player1Key = "None"
var player2Key = "None"

var ballX = (kScreenWidth-kBallDiameter)/2;
var ballY = (kScreenHeight-kBallDiameter)/2;
var ballXDirection = 1;
var ballYDirection = 1;

var bassEffect = 0;
var edgeDisplacement = 0;
var edgeVibration = 0;
var playerShrink = 0;
var playerYVibration = 0;

var backgroundGradientValue1 = 6000;
var backgroundGradientValue2 = backgroundGradientValue1+kBackgroundGradientDifference;


/** FUNCTIONS **/

function init(){
	initSongLoader();
	initKeyListeners();
	document.body.style.background = kFill;
}

function initSongLoader(){
	loader = document.querySelector(".loader");
	document.getElementById("audiofile").onchange = function(event) {
	    if(event.target.files[0]) {
	        if(typeof song != "undefined") { // Catch already playing songs
	            song.disconnect();
	            song.stop();
	        }
	        // Load our new song
	        song = loadSound(URL.createObjectURL(event.target.files[0]));
	        loader.classList.add("loading");
	    }
	}
}

function initKeyListeners(){
	window.addEventListener("keydown", function(e) {
	    // space and arrow keys
	    if([32, 37, 38, 39, 40, 83, 87].indexOf(e.keyCode) > -1) {
	        e.preventDefault();
	    }
	    if(e.keyCode == 87){
	    	player1Direction = -1;
	    }
	    if(e.keyCode == 83){
	    	player1Direction = 1;
	    }
	    if(e.keyCode == 38){
	    	player2Direction = -1;
	    }
	    if(e.keyCode == 40){
	    	player2Direction = 1;
	    }
	}, false);
	window.addEventListener("keyup", function(e) {
	    // space and arrow keys
	    if([32, 37, 38, 39, 40, 83, 87].indexOf(e.keyCode) > -1) {
	        e.preventDefault();
	    }
	    if(e.keyCode == 87 && player1Direction == -1){
	    	player1Direction = 0;
	    }
	    if(e.keyCode == 83 && player1Direction == 1){
	    	player1Direction = 0;
	    }
	    if(e.keyCode == 38 && player2Direction == -1){
	    	player2Direction = 0;
	    }
	    if(e.keyCode == 40 && player2Direction == 1){
	    	player2Direction = 0;
	    }
	}, false);
}

function setup() {
    canvas = createCanvas(kScreenWidth, kScreenHeight);
    canvas.parent("canvasDiv");
    rect(0, 0, kScreenWidth, kEdgeHeight);
    rect(0, kScreenHeight-kEdgeHeight, kScreenWidth, kEdgeHeight);
    ellipseMode(CORNER);
}

function draw() {
	playSongIfNotPlaying();

	calculateBassEffect();
	updateBackground();
	updatePlayers();
	updateEdges();
    updateBall();
    
}

function playSongIfNotPlaying(){
	if(typeof song != "undefined" && song.isLoaded() && !song.isPlaying()) {
        loader.classList.remove("loading");
        song.play();
        song.setVolume(soundVolume);
        fft = new p5.FFT();
        fft.waveform(kNumBars);
        fft.smooth(0.85);
    }
}

function calculateBassEffect(){
	bassEffect = 0;
	var barMax = kBarMax;
	if(typeof fft != "undefined") {
        var spectrum = fft.analyze();
        var totalBass = 0;
        for(var i = 0; i < kBassBars; i++) {
        	if(i <= kBassBars){
        		totalBass += min(spectrum[i], barMax);
        	}
        }
        var bassPercent = map(totalBass, 0, barMax*kBassBars, 0, 1);
        bassText.innerHTML = ""+bassPercent;
        bassEffect = map(bassPercent, kBassMin, kBassMax, 0, 1);
        bassEffect = max(bassEffect, 0);
        bassEffect = min(bassEffect, 1);
    }
}

function updateBackground(){
	backgroundGradientValue1 = (backgroundGradientValue1+kBackgroundGradientSpeed+kMaxBackgroundGradientSpeedBoost*bassEffect)%kBackgroundGradientMax;
	backgroundGradientValue2 = (backgroundGradientValue2+kBackgroundGradientSpeed+kMaxBackgroundGradientSpeedBoost*bassEffect)%kBackgroundGradientMax;
	var saturationValue = 15*bassEffect+75;

	noFill();
	colorMode(HSB, kBackgroundGradientMax, 100, 100);
	for (let i = 0; i <= 0 + kScreenHeight; i++) {
	    var colorValue = map(i, 0, 0 + kScreenHeight, 0, kBackgroundGradientDifference);
	    var currentColorValue = backgroundGradientValue1-colorValue;
	    if(currentColorValue < 0){
	    	currentColorValue = kBackgroundGradientMax+currentColorValue
	    }
	    stroke(color(currentColorValue, saturationValue, 80));
	    line(0, i, 0 + kScreenWidth, i);
	}
	//c1 = color(backgroundGradientValue1, 50, 90);
  	// c2 = color(backgroundGradientValue2, 50, 90);
  	// updateBackgroundGradient(0, 0, kScreenWidth, kScreenHeight, c1, c2);
	//background(backgroundGradientValue1, 50, 90);
}

function updateBackgroundGradient(x, y, w, h, c1, c2) {
	noFill();
	for (let i = y; i <= y + h; i++) {
	    let inter = map(i, y, y + h, 0, 1);
	    let c = lerpColor(c1, c2, inter);
	    stroke(c);
	    line(x, i, x + w, i);
	}
 }

function updateEdges(){
	edgeDisplacement = map(bassEffect, 0, 1, 0, kMaxEdgeDisplacement);
    edgeShake = random(map(bassEffect, 0, 1, 0, kMaxEdgeVibration));

    noStroke();
    fill(kFill);
    rect(0, -kMaxEdgeDisplacement-kMaxEdgeVibration+edgeDisplacement+edgeShake-kEdgeBonus, kScreenWidth, kEdgeHeight+kMaxEdgeDisplacement+kMaxEdgeVibration+kEdgeBonus);
    rect(0, kScreenHeight-kEdgeHeight-edgeDisplacement-edgeShake, kScreenWidth, kEdgeHeight+kMaxEdgeDisplacement+kMaxEdgeVibration+kEdgeBonus);
}

function updatePlayers(){
	var newPlayerHeight = kPlayerHeight-kMaxPlayerYShrink*bassEffect;
	var playerYShift = (playerHeight-newPlayerHeight)/2
	playerHeight = newPlayerHeight;

	var playerSpeed = kPlayerSpeed+kMaxPlayerSpeedBonus*bassEffect;
	player1Y += player1Direction*playerSpeed+playerYShift;
	player2Y += player2Direction*playerSpeed+playerYShift;

	var minPlayerBound = kEdgeHeight;
	var maxPlayerBound = kScreenHeight-kEdgeHeight-kPlayerHeight;

	player1Y = min(player1Y, maxPlayerBound);
	player1Y = max(player1Y, minPlayerBound);
	player2Y = min(player2Y, maxPlayerBound);
	player2Y = max(player2Y, minPlayerBound);

    player1X = kPlayerX;
    player2X = kScreenWidth-kPlayerX-kPlayerWidth;
    var player1XVibration = (random(kMaxPlayerXVibration)-kMaxPlayerXVibration/2)*bassEffect;
    var player2XVibration = (random(kMaxPlayerXVibration)-kMaxPlayerXVibration/2)*bassEffect;
    var player1YVibration = (random(kMaxPlayerYVibration)-kMaxPlayerYVibration/2)*bassEffect;
    var player2YVibration = (random(kMaxPlayerYVibration)-kMaxPlayerYVibration/2)*bassEffect;

    noStroke();
    const kBlackValue = 255;
	var kBallFill = "rgb("+kBlackValue+","+kBlackValue+","+kBlackValue+")";
    fill(kBallFill);
    //fill(kFill);
    rect(player1X+player1XVibration, player1Y+player1YVibration, kPlayerWidth, playerHeight);
    rect(player2X+player2XVibration, player2Y+player1YVibration, kPlayerWidth, playerHeight);
}

function updateBall(){
	updateBallWallCollision();
	updateBallPlayerCollision();

	ballX += (kBallSpeed+kMaxBallSpeedBonus*bassEffect)*ballXDirection;
	ballY += (kBallSpeed+kMaxBallSpeedBonus*bassEffect)*ballYDirection;

	noStroke();
	const kBlackValue = 255;
	var kBallFill = "rgb("+kBlackValue+","+kBlackValue+","+kBlackValue+")";
    fill(kBallFill);
	ellipse(ballX, ballY, kBallDiameter, kBallDiameter);
}

function updateBallWallCollision(){
	var edgeShift = edgeDisplacement+edgeVibration;

	//check collisions with wall
	if(ballX < 0){
		ballX = 0;
		ballXDirection = 1;
	} else if(ballX > kScreenWidth-kBallDiameter){
		ballX = kScreenWidth-kBallDiameter;
		ballXDirection = -1;
	}
	if(ballY <= 0+edgeShift+kEdgeHeight){
		ballYDirection = 1;
	} else if(ballY >= kScreenHeight-kBallDiameter-edgeShift-kEdgeHeight){
		ballYDirection = -1;
	}
}

function updateBallPlayerCollision(){
	ballHorizontalShift = (kBallSpeed+kMaxBallSpeedBonus*bassEffect)*ballXDirection;
	ballVerticalShift = (kBallSpeed+kMaxBallSpeedBonus*bassEffect)*ballYDirection;

	//check collisions with players
	var isBallHorizontallyInsidePlayer1 = isBallWithShiftsInside(ballHorizontalShift, 0, player1X, player1Y);
	var isBallHorizontallyInsidePlayer2 = isBallWithShiftsInside(ballHorizontalShift, 0, player2X, player2Y);
	var isBallVerticallyInsidePlayer1 = isBallWithShiftsInside(0, ballVerticalShift, player1X, player1Y);
	var isBallVerticallyInsidePlayer2 = isBallWithShiftsInside(0, ballVerticalShift, player2X, player2Y);

	if(isBallHorizontallyInsidePlayer1){
		if(ballXDirection == 1){
			ballX = player1X-kBallDiameter;
		} else{
			ballX = player1X+kPlayerWidth;
		}
		ballXDirection = -ballXDirection;
	}
	if(isBallHorizontallyInsidePlayer2){
		if(ballXDirection == 1){
			ballX = player2X-kBallDiameter;
		} else{
			ballX = player2X+kPlayerWidth;
		}
		ballXDirection = -ballXDirection;
	}
	if(isBallVerticallyInsidePlayer1){
		if(ballYDirection == 1){
			ballY = player1Y-kBallDiameter;
		} else{
			ballY = player1Y+playerHeight;
		}
		ballYDirection = -ballYDirection;
	}
	if(isBallVerticallyInsidePlayer2){
		if(ballYDirection == 1){
			ballY = player2Y-kBallDiameter;
		} else{
			ballY = player2Y+playerHeight;
		}
		ballYDirection = -ballYDirection;
	}
}

function isBallWithShiftsInside(horizontalShift, verticalShift, playerX, playerY){
	var isHorizontallyInside = ballX+horizontalShift+kBallDiameter > playerX && ballX+horizontalShift < playerX+kPlayerWidth;
	var isVerticallyInside = ballY+verticalShift+kBallDiameter > playerY && ballY+verticalShift < playerY+playerHeight;
	var isInside = isHorizontallyInside && isVerticallyInside;
	return isInside;
}

function windowResized() {
}