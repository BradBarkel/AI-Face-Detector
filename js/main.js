const video = document.getElementById("video");
let predictedAges = [];

Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
  faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
  faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
  faceapi.nets.faceExpressionNet.loadFromUri("/models"),
  faceapi.nets.ageGenderNet.loadFromUri("/models")
]).then(startVideo);


//streams video from webcam
function startVideo () {
    navigator.getUserMedia(
        { video: {}},
        stream => (video.srcObject = stream),
        err => console.error(err)
    );
}

video.addEventListener('playing', () => {
    const canvas = faceapi.createCanvasFromMedia(video);
    document.body.append(canvas);

    const displaySize = 
    { 
        width: video.width, 
        height: video.height
    };

    faceapi.matchDimensions(canvas, displaySize);

    setInterval( async () => {
        //Detect all faces
        const detections = await faceapi
        
        .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
        //include facial landmarks
        .withFaceLandmarks()
        //include facial expressions
        .withFaceExpressions()
        .withAgeAndGender();


        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        //clear canvas after each draw
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
        //draw detected faces
        faceapi.draw.drawDetections(canvas, resizedDetections);
        //draw facial landmarks
        faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
        //draw facial expressions
        faceapi.draw.drawFaceExpressions(canvas, resizedDetections);
        //draw calculated age
        const age = resizedDetections[0].age;
        const interpolatedAge = interpolateAgePredictions(age);
        const bottomRight = {
            x: resizedDetections[0].detection.box.bottomRight.x -60,
            y: resizedDetections[0].detection.box.bottomRight.y
        }
        //draw interpolated age
new faceapi.draw.DrawTextField(
    [`${faceapi.utils.round(interpolatedAge, 0)} years`],
    bottomRight).draw(canvas);

    }, 100);
});
//function to return average of predicted age
function interpolateAgePredictions (age) {
    predictedAges = [age].concat(predictedAges).slice(0,30);
    const avgPredictedAge =
    predictedAges.reduce((total, a) => total + a) / predictedAges.length;
    return avgPredictedAge;
}