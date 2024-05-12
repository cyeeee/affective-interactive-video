// https://github.com/justadudewhohacks/face-api.js/
// FaceExpression = 'neutral' | 'happy' | 'sad' | 'angry' | 'fearful' | 'disgusted' | 'surprised'

let capture; // stores video feed
let result; // stores the prediction results

const SceneState = Object.freeze({
	Rock: 0,
	RockCracks: 1,
	GrowsFlowers: 2,
	GrowsMoreFlowers: 3,
	FlowersDie: 4,
	CrackHeals: 5,
	ColorChanges: 6,
	Glows: 7,
	RockShakes: 8,
	Morphs: 9,
	BirdAppears: 10,
	BirdStays: 11,
	AnotherBirdComes: 12,
	RockCracks1: 13,
	OneFlowerGrows: 14
});
var currState = SceneState.Rock;

var lastScene = false;
var storyEnd = false;
var storyStart = false;
var count = 0;
var expressionArray = [0, 0, 0, 0, 0, 0, 0];
var currExpression;
var expReceived = false;
var sceneSwitched = false;
var currScene;
var isPlaying = false;

var time;

var vid_rock;
var vid_rock_cracks;
var vid_flowers;
var vid_more_flowers;
var vid_flowers_die;
var vid_crack_heals;
var vid_color_changes;
var vid_glows;
var vid_rock_shakes;
var vid_morphs;
var vid_bird_appears;
var vid_bird_stays;
var vid_rock_cracks_1;
var vid_another_bird;
var vid_one_flower;

function preload(){
	vid_rock = createVideo("rock.mp4");
  vid_rock_cracks = createVideo("rock_cracks.mp4");
	vid_flowers = createVideo("grows_flowers.mp4");
  vid_more_flowers = createVideo("more_flowers.mp4");
  vid_flowers_die = createVideo("flowers_die.mp4");
  vid_crack_heals = createVideo("crack_heals.mp4");
  vid_color_changes = createVideo("color_change.mp4");
  vid_glows = createVideo("glows.mp4");
  vid_rock_shakes = createVideo("rock_shakes.mp4");
	vid_morphs = createVideo("morphs.mp4");
	vid_bird_appears = createVideo("bird_appears.mp4");
	vid_bird_stays = createVideo("bird_stays.mp4");
	vid_rock_cracks_1 = createVideo("rock_cracks_1.mp4");
  vid_another_bird = createVideo("another_bird.mp4");
	vid_one_flower = createVideo("one_flower.mp4");
}

function setup() {
	createCanvas(windowWidth, windowHeight);
	frameRate(60);
	// refer to https://p5js.org/reference/#/p5/createCapture
	capture = createCapture(VIDEO, async () => {
		// read machine learning models - refer to the library api doc https://github.com/justadudewhohacks/face-api.js/
		await faceapi.loadSsdMobilenetv1Model('./');
		await faceapi.loadFaceLandmarkModel('./');
		await faceapi.loadFaceRecognitionModel('./');
		await faceapi.loadFaceExpressionModel('./');
		getExpressions();
	});
	capture.size(640, 480);
	capture.hide(); // we will display the image inside of draw, so we don't need the HTML video element

	//setup videos
	vid_rock.hide();
	vid_rock.stop();
  vid_rock_cracks.hide();
  vid_rock_cracks.stop();
	vid_flowers.hide();
	vid_flowers.stop();
  vid_more_flowers.hide();
  vid_more_flowers.stop();
  vid_flowers_die.hide();
  vid_flowers_die.stop();
  vid_crack_heals.hide();
  vid_crack_heals.stop();
  vid_color_changes.hide();
  vid_color_changes.stop();
  vid_glows.hide();
  vid_glows.stop();
  vid_rock_shakes.hide();
  vid_rock_shakes.stop();
	vid_morphs.hide();
	vid_morphs.stop();
	vid_bird_appears.hide();
	vid_bird_appears.stop();
	vid_bird_stays.hide();
	vid_bird_stays.stop();
	vid_rock_cracks_1.hide();
	vid_rock_cracks_1.stop();
  vid_another_bird.hide();
  vid_another_bird.stop();
	vid_one_flower.hide();
	vid_one_flower.stop();
	
	currScene = vid_rock;
	
	imageMode(CENTER);
}

async function getExpressions(){
	result = await faceapi.detectSingleFace(capture.elt).withFaceLandmarks().withFaceExpressions();
	getExpressions(); // recursively call getExpressions function forever
}

function draw() {
	background(0);
	//image(capture, 0, 0, 640, 480);	// don't show captures
	
	fill(255);
	textFont('Times New Roman'); 
	textAlign(CENTER); 
	textSize(18);
	if (!result) {
		if (!storyStart) {
			text('stroy loading...\nwaiting for face detection...', windowWidth/2, windowHeight/2);
		} 
	}
	else {
		storyStart = true;
		time = currScene.duration() - currScene.time();
		if (!lastScene) {
			if (time > 0) {
				receiveExpression();
				sceneSwitched = false;
			}
			else {
				if (!expReceived) {
					getExpression();
				}
				if (!sceneSwitched) {
					switchScene();
					console.log('scene progressing, expression: ' + currExpression);
				}
			}				
		}
		else {
			if (time <= 0) {
				storyEnd = true;
			}
		}

	}
	
	if (storyStart) {
		if (!storyEnd) {
			image(currScene, windowWidth/2, windowHeight/2, windowWidth, windowWidth/16*9);
			if (!isPlaying) {
				currScene.play();
				isPlaying = true;
			}
		}
		else {
			currScene.stop();
			currScene.hide();
			text('to be continuted', windowWidth/2, windowHeight/2);
		}
	}
}

function receiveExpression() {
	if(result.expressions != null){
		let expressions = result.expressions;
		// Create items array
		let expressionValues = Object.values(expressions);
		
		expressionArray[0] += expressionValues[0];
		expressionArray[1] += expressionValues[1];
		expressionArray[2] += expressionValues[2];
		expressionArray[3] += expressionValues[3];
		expressionArray[4] += expressionValues[4];
		expressionArray[5] += expressionValues[5];
		expressionArray[6] += expressionValues[6];		
		count++;
	} 	
}

function getExpression() {
	for (let i = 0; i < expressionArray.length; i++) {
		expressionArray[i] /= count;	// compute the average over time
	}
	
	let max = Math.max.apply(Math, expressionArray);
	let idx = expressionArray.indexOf(max);
	currExpression = Object.keys(result.expressions)[idx];
	expReceived = true;
	
	//reset
	count = 0;
	expressionArray = [0, 0, 0, 0, 0, 0, 0];
}

function switchScene() {
	currScene.stop();
	isPlaying = false;
	
	switch (currState) {
		case SceneState.Rock:
			if (currExpression === 'happy' || currExpression === 'neutral') {
				currState = SceneState.RockCracks;
				currScene = vid_rock_cracks;
			}
			else if (currExpression === 'sad' || currExpression === 'angry' || currExpression === 'disgusted') {
				currState = SceneState.RockShakes;
				currScene = vid_rock_shakes;
			}
			else {
				currState = SceneState.BirdAppears;
				currScene = vid_bird_appears;
			}
			break;
		case SceneState.RockCracks:
			if (currExpression === 'happy' || currExpression === 'neutral') {
				currState = SceneState.GrowsFlowers;
				currScene = vid_flowers;
			}
			else {
				currState = SceneState.CrackHeals;
				currScene = vid_crack_heals;
			}
			break;
		case SceneState.GrowsFlowers:
			if (currExpression === 'happy' || currExpression === 'neutral') {
				currState = SceneState.GrowsMoreFlowers;
				currScene = vid_more_flowers;
				lastScene = true;
			}
			else {
				currState = SceneState.FlowersDie;
				currScene = vid_flowers_die;
				lastScene = true;
			}
			break;
		case SceneState.CrackHeals:
			if (currExpression === 'happy' || currExpression === 'neutral') {
				currState = SceneState.Glows;
				currScene = vid_glows;
				lastScene = true;
			}
			else {
				currState = SceneState.ColorChanges;
				currScene = vid_color_changes;
				lastScene = true;
			}
			break;
		case SceneState.RockShakes:
			if (currExpression === 'sad' || currExpression === 'angry' || currExpression === 'disgusted') {
				currState = SceneState.Morphs;
				currScene = vid_morphs;
				lastScene = true;
			}
			else {
				currState = SceneState.Glows;
				currScene = vid_glows;
				lastScene = true;
			}
			break;
		case SceneState.BirdAppears:
			if (currExpression === 'sad' || currExpression === 'angry' || currExpression === 'disgusted') {
				currState = SceneState.RockCracks1;
				currScene = vid_rock_cracks_1;
			}
			else {
				currState = SceneState.BirdStays;
				currScene = vid_bird_stays;
			}
			break;
		case SceneState.BirdStays:
			currState = SceneState.AnotherBirdComes;
			currScene = vid_another_bird;
			lastScene = true;
			break;
		case SceneState.RockCracks1:
			currState = SceneState.OneFlowerGrows;
			currScene = vid_one_flower;
			lastScene = true;
			break;
		default:
			break;
	}
	sceneSwitched = true;
	expReceived = false;
}
