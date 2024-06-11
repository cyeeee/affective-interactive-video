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

const VIDEOS = [];
const VID_NUM = 15;

function preload(){
	for (let i = 0; i < VID_NUM; i++) {
		const vi = createVideo(`videos/${i}.mp4`);
		VIDEOS.push(vi);
	}
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
	for (let i = 0; i < VID_NUM; i++) {
		VIDEOS[i].hide();
		VIDEOS[i].stop();
	}

	currScene = VIDEOS[0];
	
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
				currScene = VIDEOS[currState];
			}
			else if (currExpression === 'sad' || currExpression === 'angry' || currExpression === 'disgusted') {
				currState = SceneState.RockShakes;
				currScene = VIDEOS[currState];
			}
			else {
				currState = SceneState.BirdAppears;
				currScene = VIDEOS[currState];
			}
			break;
		case SceneState.RockCracks:
			if (currExpression === 'happy' || currExpression === 'neutral') {
				currState = SceneState.GrowsFlowers;
				currScene = VIDEOS[currState];
			}
			else {
				currState = SceneState.CrackHeals;
				currScene = VIDEOS[currState];
			}
			break;
		case SceneState.GrowsFlowers:
			if (currExpression === 'happy' || currExpression === 'neutral') {
				currState = SceneState.GrowsMoreFlowers;
				currScene = VIDEOS[currState];
				lastScene = true;
			}
			else {
				currState = SceneState.FlowersDie;
				currScene = VIDEOS[currState];
				lastScene = true;
			}
			break;
		case SceneState.CrackHeals:
			if (currExpression === 'happy' || currExpression === 'neutral') {
				currState = SceneState.Glows;
				currScene = VIDEOS[currState];
				lastScene = true;
			}
			else {
				currState = SceneState.ColorChanges;
				currScene = VIDEOS[currState];
				lastScene = true;
			}
			break;
		case SceneState.RockShakes:
			if (currExpression === 'sad' || currExpression === 'angry' || currExpression === 'disgusted') {
				currState = SceneState.Morphs;
				currScene = VIDEOS[currState];
				lastScene = true;
			}
			else {
				currState = SceneState.Glows;
				currScene = VIDEOS[currState];
				lastScene = true;
			}
			break;
		case SceneState.BirdAppears:
			if (currExpression === 'sad' || currExpression === 'angry' || currExpression === 'disgusted') {
				currState = SceneState.RockCracks1;
				currScene = VIDEOS[currState];
			}
			else {
				currState = SceneState.BirdStays;
				currScene = VIDEOS[currState];
			}
			break;
		case SceneState.BirdStays:
			currState = SceneState.AnotherBirdComes;
			currScene = VIDEOS[currState];
			lastScene = true;
			break;
		case SceneState.RockCracks1:
			currState = SceneState.OneFlowerGrows;
			currScene = VIDEOS[currState];
			lastScene = true;
			break;
		default:
			break;
	}
	sceneSwitched = true;
	expReceived = false;
}
