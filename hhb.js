var birdCanvas, birdFacesCanvas, pigCanvas, staticCanvas, eastReport, westReport, eastBird, westBird;
var ballRadius = 10;
var intervalId = 0;
var pfWidth = 1024;
var pfHeight = 768;
var firstDraw = true;
var pigCount = 100;
var pigs = [];
var capturedPigs = [];
var birdCount = 2;
var birds = [];
var captureOffset = 150;
var pigStartRadius = 250;
var pigStartXOffset = (pfWidth - pigStartRadius) / 2;
var pigStartYOffset = (pfHeight - pigStartRadius) / 2;
var velocityThreshold = 20;
var gameState;
var gameStates = {
	isInitialized: 0,
	isPlaying: 1,
	isPaused: 2,
	isOver: 3
}

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

function showCapture(x, y, pointVal) {

	var $score = $('<b class="score">' + pointVal + '</b>');
	$score.css(
		{
			left: x,
			top: y
		}
	);
	$score.appendTo('body').bind('webkitTransitionEnd', function(e) {
		$(e.srcElement).remove();
	});
	setTimeout( function() { $score.addClass('transition') }, 0); // setTimeout makes sure it's rendered onscreen before adding the class... required to kick off transitions
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
	this.pointVal = 10;
}

function Bird(x, y, color, axis, direction, id, imgSrc, captureX, captureY, reportContext) {
	this.score = 0;
	this.range = 150;
	this.captureRadius = 125;
	this.radius = 150;
	this.defaultRadius = this.radius;
	this.maxRadius = 225;
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
	this.endPoint = this.startPoint + (this.range * this.direction);
	this.midPoint = this.startPoint + ((this.range/2) * this.direction);
	this.reportContext = reportContext;
	this.launch = function() {
		var self = this;
		self.launched = true;
		var from = { anim: self.startPoint };
		var to = { anim:  self.endPoint  };
		$(from).animate(to, { 
			duration: 125,
			step: function() {
				if (self.axis == 'x') self.x = this.anim;
				else self.y = this.anim;
				
				if (self.radius < self.maxRadius) self.radius += 7;
				else self.radius -= 7;
				
			},
			complete: function() {
				self.capture();
				self.retreat();
			}
		});
	},
	this.retreat = function() {
		var self = this;
		self.radius = self.defaultRadius;
		var from = { anim: self.endPoint };
		var to = { anim:  self.startPoint };
		$(from).animate(to, { 
			duration: 275,
			step: function() {
				if (self.axis == 'x') self.x = this.anim;
				else self.y = this.anim;
			},
			complete: function() {
				(self.axis == 'x') ? self.x = self.startPoint : self.y = self.startPoint;
				self.launched = false;
				self.reportContext.clearRect(0,0,pfWidth,pfHeight);
				
			}
		});
	}
	this.capture = function() {
		
		var r = this.reportContext;

		for(i=0; i<pigCount; i++) {
			
			if (pigs[i].inPlay == false) continue;

			if ( inCaptureArea(this.captureX, this.captureY, this.captureRadius, pigs[i].centerX, pigs[i].centerY) ) {
				showCapture(pigs[i].centerX, pigs[i].centerY, pigs[i].pointVal);
				pigs[i].inPlay = false;
				capturedPigs.push(pigs[i]);
				this.score += pigs[i].pointVal;
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

function victoryMessage(winner, loser) {
	var messages = [
			winner + ' is victorious!',
			'and the winner is... ' + winner + '!',
			winner + ' takes it all!',
			winner + ' tastes of win and God',
			'all ' + loser +'\'s base are belong to ' + winner ,
			'sorry, ' + loser + ', you got served, yo',
			'awwww snap! ' + winner + ' schooled you, ' + loser,
			winner + ": thrill of victory " + loser + ": agony of defeat.",
			'epic win: ' + winner + '. epic fail: ' + loser 
			
	];
	var index = Math.floor( Math.random()* messages.length);
	return messages[index];
}


function gameOver() {
	
	gameState = gameStates.isOver;
	eastReport.clearRect(0,0,pfWidth,pfHeight);
	westReport.clearRect(0,0,pfWidth,pfHeight);
	clearInterval(intervalId);
	unbindGameplayHandlers();
			
	var eScore = parseFloat($('#eScore').text());
	var wScore = parseFloat($('#wScore').text());
	var message;
	if (eScore > wScore) {
		message = victoryMessage('blue', 'black');
	}
	else if (wScore > eScore) {
		message = victoryMessage('black', 'blue');
	}
	else {
		message = 'it\s a tie! REMATCH!';
	}
	
	$('#mask').removeClass('offscreen');
	$('#victor').text(message);
	var victorOffset = $('#victor').outerWidth() / 2;
	$('#victor').css({marginLeft : (-1 * victorOffset)}).fadeIn('slow');
	$('#start').text('play again');

}

function drawCaptureArea(bird) {

	staticCanvas.fillStyle = 'rgba(255,255,255, 0.8)';
	staticCanvas.beginPath();	
 	staticCanvas.arc(bird.captureX, bird.captureY, bird.captureRadius, 0, Math.PI*2, false);
	staticCanvas.closePath();
	staticCanvas.fill();
	
}

function drawPig(pig) {
	if (!pig.inPlay) return;
	if (pig.x + pig.xVel < 0 || pig.x + pig.xVel + pig.width > pfWidth ) {
		pig.xVel = -pig.xVel
	}
	if (pig.y + pig.yVel < 0 || pig.y + pig.yVel + pig.height > pfHeight ) {
		pig.yVel = -pig.yVel
	}					
		pigCanvas.drawImage(pig.pigImg, pig.x += pig.xVel, pig.y += pig.yVel );
}

function drawBird(bird) {
	birdCanvas.fillStyle = bird.color;
	birdCanvas.beginPath();
	birdCanvas.arc(bird.x, bird.y, bird.radius, 0, Math.PI*2, false);
	if (bird.id == 'n') {
		birdCanvas.strokeStyle = '#444444';
		birdCanvas.stroke();	
	}
	birdCanvas.closePath();
	birdCanvas.fill();

	var faceOffsetX;
	var faceOffsetY;
	switch(bird.id) {
		case 'e':
			faceOffsetX = -130;
			faceOffsetY = -25;
			break;
		case 'w':
			faceOffsetX = 60;
			faceOffsetY = -30;
			break;
		default:
			faceOffsetX = faceOffsetY = 0;
			break;
  }
 			  
  birdFacesCanvas.drawImage(bird.face, bird.x + faceOffsetX, bird.y + faceOffsetY);
  
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
			case 13: // enter
				e.preventDefault();
				nudgeBoard();			
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

function pigVelocityRandomizer() {
	var num = Math.ceil(Math.random()*25) * startDirectionRandomizer();
	return num ;
}

function startOrContinue() {
	gameState = gameStates.isPlaying;
	$('#mask').addClass('offscreen');
	bindGameplayHandlers();
	$('#start').text('pause');
	intervalId = setInterval(draw, 20);
	return intervalId;

}

function pausePlay() {
	gameState = gameStates.isPaused;
	$('#mask').removeClass('offscreen');
	unbindGameplayHandlers();
	clearInterval(intervalId);
	$('#start').text('continue');
}

function init() {
	
	$('#victor').fadeOut('fast', function() { $(this).css({visibility:'visible'}); } );
	
	if(!document.createElement('canvas').getContext) 
	{
		$(body).empty().html('<p>This browser doesn\'t support the canvas element. Try <a href="http://google.com/chrome">one</a> <a href="http://getfirefox.com">that</a> <a href="http://ie.microsoft.com/testdrive/">does</a>.');
	}
	
	if (intervalId != undefined) clearInterval(intervalId);
	
	pigs = [];
	birds = [];
	capturedPigs = [];
	
	birdCanvas = document.getElementById('hhb').getContext('2d');

	birdCanvas.shadowColor = '#444444';
	birdCanvas.shadowOffsetY = 2;
	birdCanvas.shadowBlur = 8;	

	pigCanvas = document.getElementById('pigs').getContext('2d');
	birdFacesCanvas = document.getElementById('birdFaces').getContext('2d');
	staticCanvas = document.getElementById('static').getContext('2d');
	eastReport = document.getElementById('eastReport').getContext('2d');
	westReport = document.getElementById('westReport').getContext('2d');
	
	birdCanvas.clearRect(0, 0, pfWidth, pfHeight);
	pigCanvas.clearRect(0, 0, pfWidth, pfHeight);
	birdFacesCanvas.clearRect(0, 0, pfWidth, pfHeight);
	eastReport.clearRect(0, 0, pfWidth, pfHeight);
	westReport.clearRect(0, 0, pfWidth, pfHeight);
	staticCanvas.clearRect(0, 0, pfWidth, pfHeight);
					
	// generate pigs w/ randomized start position, imgSrc, and x/y velocity
	for(i=0; i<pigCount; i++) {

		pigs.push( new Pig(
					Math.floor(Math.random()*pigStartRadius) + pigStartXOffset, // start X
					Math.floor(Math.random()*pigStartRadius) + pigStartYOffset, // start Y
					Math.floor(Math.random()*6) +  1, 	 // randomize the imgNum 
					pigVelocityRandomizer(), // xVel
					pigVelocityRandomizer() // yVel
				)
			);						
	}

	for(i=0; i<pigCount; i++) {
		switch(pigs[i].imgNum) {
			case 1:
				pigs[i].pigImg.src = pigImgs.pig1;
				pigs[i].pointVal = 50;
				break;
			case 2:
				pigs[i].pigImg.src = pigImgs.pig2;
				pigs[i].pointVal = 40;
				break;
			case 3:
				pigs[i].pigImg.src = pigImgs.pig3;
				break;
			case 4:
				pigs[i].pigImg.src = pigImgs.pig4;
				break;
			case 5:
				pigs[i].pigImg.src = pigImgs.pig5;
				pigs[i].pointVal = 20;
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
		var totalVelocity = Math.abs(pigs[i].xVel) + Math.abs(pigs[i].yVel);
		
		if (totalVelocity < velocityThreshold ) {
			
			var deficit = velocityThreshold - totalVelocity;  
					
			var switcher = startDirectionRandomizer();
			if (switcher > 0) {
				pigs[i].xVel = (pigs[i].xVel > 0) ? pigs[i].xVel + deficit : pigs[i].xVel - deficit;
			}
			else {
				pigs[i].yVel = (pigs[i].yVel > 0) ? pigs[i].yVel + deficit : pigs[i].yVel - deficit; 
			}
			//console.log('final total velocity:'+ (Math.abs(pigs[i].xVel) + Math.abs(pigs[i].yVel)) );	
		}
		
	}
	
	eastBird 	= new Bird( pfWidth, pfHeight/2, '#64acc8', 'x', -1, 'e', birdImgs.blueBird,  pfWidth-captureOffset, pfHeight/2, eastReport );
	westBird 	= new Bird(   0, pfHeight/2, '#000000', 'x',  1, 'w', birdImgs.blackBird, captureOffset, pfHeight/2, westReport );
	
	birds = [ eastBird, westBird ];

	for(i=0; i<birdCount; i++)
	{
		birds[i].score = 0;
		drawCaptureArea(birds[i]);
		drawBird(birds[i]);
	}
	
	$('#eScore, #wScore').text('0');
	$('#victor').empty();	
	$('#mask').removeClass('offscreen');
	$('#start').focus();
		
	draw();
	gameState = gameStates.isInitialized;

}
			
function draw() {

	birdCanvas.clearRect(0, 0, pfWidth, pfHeight);
	pigCanvas.clearRect(0, 0, pfWidth, pfHeight);
	birdFacesCanvas.clearRect(0, 0, pfWidth, pfHeight);
	
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

function nudgeBoard() {
	for(i=0; i<pigCount; i++) {
		if (pigs[i].inPlay) {
			pigs[i].xVel = 	pigVelocityRandomizer();
			pigs[i].yVel =	pigVelocityRandomizer();
		}
	}
}

function bindPersistentControls() {
	$(document).bind('keydown', function(e) {
		if(e.keyCode == 32) { // space bar
			e.preventDefault();
			$('#start').click();
		}
	});
	
	$('#start').click(function() {
		if (gameState == gameStates.isPlaying) {
			pausePlay();
		}
		else if (gameState == gameStates.isOver) {
			init();
			startOrContinue();
		}
		else {
			startOrContinue();
		}	
	});
}

function addLogoToPlayfield() {
	var clonedLogo = $('#logo').clone().attr('id', 'playfieldLogo').insertAfter('#static').css({'opacity':'0.3'});
}

$(window).load(function() {
	init();
	bindPersistentControls();
	addLogoToPlayfield();
});