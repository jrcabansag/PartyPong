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
const kMaxBallSpeedBonus = 15;

const kPlayerHeight = 140;
const kPlayerWidth = 12;
const kPlayerX = 75;
const kPlayerSpeed = 7;
const kMaxPlayerSpeedBonus = 5;
const kMaxPlayerYVibration = 7;
const kMaxPlayerXVibration = 3;

const kScreenWidth = 1200;
const kScreenHeight = 800;
const kEdgeHeight = 50;
const kEdgeBonus = 50;
const kMaxEdgeDisplacement = 100; //how much the edges of the stage will be displaced at max bass effect
const kMaxEdgeVibration = 15;





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



/** FUNCTIONS **/

function init(){
	initSongLoader();
	initKeyListeners();
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
	updateEdges();
    updatePlayers();
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
	background(51);
}

function updateEdges(){
	edgeDisplacement = map(bassEffect, 0, 1, 0, kMaxEdgeDisplacement);
    edgeShake = random(map(bassEffect, 0, 1, 0, kMaxEdgeVibration));

    noStroke();
    fill("rgb(255, 255, 255)");
    rect(0, -kMaxEdgeDisplacement-kMaxEdgeVibration+edgeDisplacement+edgeShake-kEdgeBonus, kScreenWidth, kEdgeHeight+kMaxEdgeDisplacement+kMaxEdgeVibration+kEdgeBonus);
    rect(0, kScreenHeight-kEdgeHeight-edgeDisplacement-edgeShake, kScreenWidth, kEdgeHeight+kMaxEdgeDisplacement+kMaxEdgeVibration+kEdgeBonus);
}

function updatePlayers(){
	var playerSpeed = kPlayerSpeed+kMaxPlayerSpeedBonus*bassEffect;
	player1Y += player1Direction*playerSpeed;
	player2Y += player2Direction*playerSpeed;

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
    fill("rgb(255, 255, 255)");
    rect(player1X+player1XVibration, player1Y+player1YVibration, kPlayerWidth, kPlayerHeight);
    rect(player2X+player2XVibration, player2Y+player1YVibration, kPlayerWidth, kPlayerHeight);
}

function updateBall(){
	var edgeShift = edgeDisplacement+edgeVibration

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
			ballY = player1Y+kPlayerHeight;
		}
		ballYDirection = -ballYDirection;
	}
	if(isBallVerticallyInsidePlayer2){
		if(ballYDirection == 1){
			ballY = player2Y-kBallDiameter;
		} else{
			ballY = player2Y+kPlayerHeight;
		}
		ballYDirection = -ballYDirection;
	}

	ballX += (kBallSpeed+kMaxBallSpeedBonus*bassEffect)*ballXDirection;
	ballY += (kBallSpeed+kMaxBallSpeedBonus*bassEffect)*ballYDirection;

	noStroke();
    fill("rgb(255, 255, 255)");
	ellipse(ballX, ballY, kBallDiameter, kBallDiameter);
}

function isBallWithShiftsInside(horizontalShift, verticalShift, playerX, playerY){
	var isHorizontallyInside = ballX+horizontalShift+kBallDiameter > playerX && ballX+horizontalShift < playerX+kPlayerWidth;
	var isVerticallyInside = ballY+verticalShift+kBallDiameter > playerY && ballY+verticalShift < playerY+kPlayerHeight;
	var isInside = isHorizontallyInside && isVerticallyInside;
	return isInside;
}

function windowResized() {
}