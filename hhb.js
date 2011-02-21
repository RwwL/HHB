var c, s, r, eastBird, westBird;
var ballRadius = 10;
var intervalId = 0;
var pfWidth = 1024;
var pfHeight = 768;
var firstDraw = true;
var pigCount = 5;
var pigs = [];
var capturedPigs = [];
var birdCount = 2;
var birds = [];
var captureOffset = 150;
var pigStartRadius = 250;
var pigStartXOffset = (pfWidth - pigStartRadius) / 2;
var pigStartYOffset = (pfHeight - pigStartRadius) / 2;
//var gameStates = { 'firstLoad', 'isPlaying', ' }
//var gameState = gameStates. 

// preload
for(var prop in birdImgs) {
	var i = new Image();
	i.src = birdImgs[prop];
}
for(var prop in pigImgs) {
	var i = new Image();
	i.src = pigImgs[prop];
}

function square(a) {
	return a * a;
}

function Pig(x, y, imgNum, xVel, yVel) {
	this.x	= x;
	this.y	= y;				
	this.imgNum	= imgNum;
	this.xVel = xVel;
	this.yVel = yVel;
	this.pigImg = new Image();
	this.pigImg.src = pigImgs.pig1;
	this.inPlay = true;
	this.width = 0;
	this.height = 0;
	this.centerX;
	this.centerY;
}

function Bird(x, y, color, axis, direction, id, imgSrc, captureX, captureY) {
	this.score = 0;
	this.range = 150;
	this.captureRadius = 125;
	this.radius = 150;
	this.launched = false;
	this.x = x;
	this.y = y;
	this.startX = x;
	this.startY = y;
	this.captureX = captureX;
	this.captureY = captureY;
	this.id = id;
	this.color = color;
	this.direction = direction;
	this.axis = axis;
	this.face = new Image();
	this.face.src = imgSrc;
	this.scoreSelector = '#' + this.id + 'Score';
	this.startPoint = (this.axis == 'x') ? this.startX : this.startY;
	this.launch = function() {
		var self = this;
		self.launched = true;
		var from = { anim: this.startPoint };
		var to = { anim:  this.startPoint + (this.range * this.direction)  };
		
		$(from).animate(to, { 
			duration: 125,
			step: function() {
				if (self.axis == 'x') self.x = this.anim;
				else self.y = this.anim;
			},
			complete: function() {
				self.capture();
				self.retreat();
			}
		});
	},
	this.retreat = function() {
		var self = this;
		var from = { anim: this.startPoint + (this.range * this.direction) };
		var to = { anim:  this.startPoint };
		$(from).animate(to, { 
			duration: 275,
			step: function() {
				if (self.axis == 'x') self.x = this.anim;
				else self.y = this.anim;
			},
			complete: function() {
				(self.axis == 'x') ? self.x = self.startPoint : self.y = self.startPoint;
				self.launched = false;
			}
		});
	}
	this.capture = function() {
		
		// draw capture area on test canvas
/*
		r.clearRect(0, 0, 500, 500);
		r.fillStyle = '#ffffff';
		r.beginPath();	
	 	r.arc(this.captureX, this.captureY, this.captureRadius, 0, Math.PI*2, false);
		r.closePath();
		r.fill();
*/	

		for(i=0; i<pigCount; i++) {
			
			if (pigs[i].inPlay == false) continue;

			// map all the pigs at moment of capture in red on test canvas
/*
			r.fillStyle = 'rgb(255,0,0)';
			r.beginPath();
				r.arc(pigs[i].centerX, pigs[i].centerY, 10, 0, Math.PI*2, false);
			r.closePath();
			r.fill();
*/

			if ( inCaptureArea(this.captureX, this.captureY, this.captureRadius, pigs[i].centerX, pigs[i].centerY) ) {
				pigs[i].inPlay = false;
				capturedPigs.push(pigs[i]);
				this.score++;
				$(this.scoreSelector).text(this.score);
				if (capturedPigs.length == pigCount) gameOver();
			}
		}
	}
}

function inCaptureArea(centerX, centerY, cRadius, pointX, pointY) {
	var squareDistance = (square(centerX - pointX)) + (square((centerY - pointY)));
	return squareDistance < square(cRadius);
}


function gameOver() {
	
	clearInterval(intervalId);
	
	c.fillStyle = "rgba(0,0,0, .8)";
	c.beginPath();
	c.rect(0, 0, pfWidth, pfHeight);
	c.closePath();
	c.fill();

	$('#hhb').click(preReset);
	
	var cv = document.getElementById('hhb');
	if( cv.getContext && typeof cv.getContext('2d').fillText == 'function') {
		
		c.fillStyle = "rgb(255,255,255)";
		c.strokeStyle = "rgb(255,255,255)";
		c.font = "bold 48px sans-serif";
		c.textAlign = "center";
		c.fillText("game over", pfWidth/2, 225);
		c.font = "normal 18px sans-serif";
		c.fillText("click here to reset", pfWidth/2, 275);					
	}
	else { 
		alert("Game over! Click OK to reset and play again.");
		preReset();
	}
}

function preReset() {
	$('#start').click().text('play again!');
	init();
}

function drawCaptureArea(bird) {

	s.fillStyle = 'rgba(255,255,255, 0.3)';
	s.beginPath();	
 	s.arc(bird.captureX, bird.captureY, bird.captureRadius, 0, Math.PI*2, false);
	s.closePath();
	s.fill();
	
	r.fillStyle = '#fff';
	r.beginPath();	
 	r.arc(bird.captureX, bird.captureY, bird.captureRadius, 0, Math.PI*2, false);
	r.closePath();
	r.fill();
	
}

function drawPig(pig) {	
	if (pig.x + pig.xVel < 0 || pig.x + pig.xVel + pig.width > pfWidth ) {
		pig.xVel = -pig.xVel
	}
	if (pig.y + pig.yVel < 0 || pig.y + pig.yVel + pig.height > pfHeight ) {
		pig.yVel = -pig.yVel
	}					
		c.drawImage(pig.pigImg, pig.x += pig.xVel, pig.y += pig.yVel );
}

function drawBird(bird) {
	c.fillStyle = bird.color;
	c.beginPath();
	c.arc(bird.x, bird.y, bird.radius, 0, Math.PI*2, false);
	if (bird.id == 'n') {
		c.strokeStyle = '#444444';
		c.stroke();	
	}
	c.closePath();
	c.fill();

	var faceOffsetX;
	var faceOffsetY;
	switch(bird.id) {
		case 'n':
			faceOffsetX = -28;
			faceOffsetY = 15;
			break;
		case 's':
			faceOffsetX = -32;
			faceOffsetY = -92;
			break;
		case 'e':
			faceOffsetX = -90;
			faceOffsetY = -25;
			break;
		case 'w':
			faceOffsetX = 25;
			faceOffsetY = -30;
			break;
		default:
			faceOffsetX = faceOffsetY = 0;
			break;
  }
 			  
  c.drawImage(bird.face, bird.x + faceOffsetX, bird.y + faceOffsetY);
  
}

function bindGameplayHandlers() {
	$(document).bind('keydown.gameplay', function(e) {
		switch(e.keyCode) {
			case 76: // L
				e.preventDefault();
				if (!eastBird.launched) {
					eastBird.launch();
				}
				break;
			case 65: // A
				e.preventDefault();
				if (!westBird.launched) {
					westBird.launch();
				}
				break;
			default:
				break;
		}
	});
}

function unbindGameplayHandlers() {
	$(document).unbind('.gameplay');
}

function startDirectionRandomizer() {
	var num = (Math.floor(Math.random()*5)) + 1;
	return (num % 2 == 0) ? 1 : -1;
}

function bindPlayPauseControl() {
	$(document).bind('keydown.playpause', function(e) {
		if(e.keyCode == 32) {
			e.preventDefault();
			$('#start').click();
		}
	});
}

function startOrContinue() {
	$('#mask').addClass('offscreen');
	bindGameplayHandlers();
	$(this).text('pause');
	intervalId = setInterval(draw, 25);
	return intervalId;
}

function pausePlay() {
	$('#mask').removeClass('offscreen');
	unbindGameplayHandlers();
	$(this).text('continue');
	clearInterval(intervalId);
}

function init() {
	
	$(document).unbind('.gameover');
	
	if(!document.createElement('canvas').getContext) 
	{
		$(body).empty().html('<p>This browser doesn\'t support the canvas element. Try <a href="http://google.com/chrome">one</a> <a href="http://getfirefox.com">that</a> <a href="http://ie.microsoft.com/testdrive/">does</a>.');
	}
	
	if (intervalId != undefined) clearInterval(intervalId);
	
	pigs = [];
	birds = [];
	capturedPigs = [];
	
	c = document.getElementById('hhb').getContext('2d');  
	s = document.getElementById('static').getContext('2d');
	r = document.getElementById('report').getContext('2d');
	
	c.clearRect(0, 0, pfWidth, pfHeight);
	s.clearRect(0, 0, pfWidth, pfHeight);
	r.clearRect(0, 0, pfWidth, pfHeight);
				
	// generate pigs w/ randomized start position, imgSrc, and x/y velocity
	for(i=0; i<pigCount; i++) {
		
		pigs.push( new Pig(
					Math.floor(Math.random()*pigStartRadius) + pigStartXOffset, // start X
					Math.floor(Math.random()*pigStartRadius) + pigStartYOffset, // start Y
					Math.floor(Math.random()*6) +  1, 	 // randomize the imgNum 
					(Math.ceil(Math.random()*15)) * startDirectionRandomizer(),	// xVel
					(Math.ceil(Math.random()*15)) * startDirectionRandomizer() 	// yVel
				)
			);						
	}

	for(i=0; i<pigCount; i++) {
		switch(pigs[i].imgNum) {
			case 1:
				pigs[i].pigImg.src = pigImgs.pig1;
				break;
			case 2:
				pigs[i].pigImg.src = pigImgs.pig2;
				break;
			case 3:
				pigs[i].pigImg.src = pigImgs.pig3;
				break;
			case 4:
				pigs[i].pigImg.src = pigImgs.pig4;
				break;
			case 5:
				pigs[i].pigImg.src = pigImgs.pig5;
				break;
			case 6:
				pigs[i].pigImg.src = pigImgs.pig6;
				break;
			default:
				break;
		}
		pigs[i].width = pigs[i].pigImg.width;
		pigs[i].height = pigs[i].pigImg.height;
		
		//make sure there aren't any pigs that are too slow
		if (pigs[i].xVel < 2 && pigs[i].yVel < 2) {
			var prop = (startDirectionRandomizer() == 1) ? pigs[i].xVel : pigs[i].yVel;
		 	prop = Math.floor(Math.random()*5) + 5;
		}
		
	}
	
	eastBird 	= new Bird( pfWidth, pfHeight/2, '#64acc8', 'x', -1, 'e', birdImgs.blueBird,  pfWidth-captureOffset, pfHeight/2 );
	westBird 	= new Bird(   0, pfHeight/2, '#000000', 'x',  1, 'w', birdImgs.blackBird, captureOffset, pfHeight/2 );
	
	birds = [ eastBird, westBird ];

	for(i=0; i<birdCount; i++)
	{
		birds[i].score = 0;
		drawCaptureArea(birds[i]);
		drawBird(birds[i]);
	}
	
	$('#playfield b').text('0');
	$('#hhb').unbind('click keydown');
	$('#start').text('play').toggle(
		startOrContinue, pausePlay
	);
	
	$('#mask').removeClass('offscreen');
	$('#start').focus();
		
	draw();
}
			
function draw() {

 	c.clearRect(0, 0, 1024, 768);
	
	for(i=0; i<pigCount; i++)
	{
		if (pigs[i].inPlay == true) {
			pigs[i].centerX = pigs[i].x + (pigs[i].width / 2);
			pigs[i].centerY = pigs[i].y	 + (pigs[i].height / 2);
			drawPig(pigs[i]);
		} 

	}
	
	for(i=0; i<birdCount; i++)
	{
		drawBird(birds[i]);
	}
	
	// for debugging... you can log something in draw()
	// without killing the console via if(firstDraw)
	// how the hell do real game-loop developers do this?
	//firstDraw = false;
  	
}

$(window).load(function() {
	init();
	bindPlayPauseControl();
});