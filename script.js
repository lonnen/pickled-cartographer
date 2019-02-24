/* global contours */

let sensorWidth = 256;
let sensorHeight = 256;

let signatureSize = 64;

let video = document.querySelector("video");
let hasCapture = false;
function init() {
  console.log('click');
  navigator.mediaDevices.getUserMedia({
    audio: false,
    video: true
  }).then(start).catch(e => console.error(e));
}

function start(stream) {
  video.srcObject = stream;
  video.play();
  
  let outCanvas = document.querySelector('.output');
  let outCtx = outCanvas.getContext('2d');
  
  let canvas = document.createElement('canvas');
  document.body.appendChild(canvas);
  canvas.width = sensorWidth;
  canvas.height = sensorHeight;
  
  let signature = document.createElement('canvas');
  signature.width = signatureSize;
  signature.height = signatureSize;
  
  let ctx = canvas.getContext('2d');
  let grayBuffer = new Float32Array(sensorWidth * sensorHeight);
  let kernelBuffer = new Float32Array(sensorWidth * sensorHeight);

  let alphaBuffer = new Uint8ClampedArray(sensorWidth * sensorHeight);
  function frame() {
    outCanvas.width = video.videoWidth;
    outCanvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight, 0, 0, sensorWidth, sensorHeight);
    let id = ctx.getImageData(0, 0, sensorWidth, sensorHeight);
    let data = id.data;
    
    // the meat
    let max = 0;
    let min = Infinity;
    for (let i = 0; i < data.length; i+=4) {
      let yellow = data[i] + data[i+1];
      if (yellow > max) {
        max = yellow;
      }
      if (yellow < min) {
        min = yellow;
      }
    }
    
    let threshold = .7;
    let threshValue = (max - min) * threshold + min;
    for (let i = 0; i < data.length; i+=4) {
      let yellow = data[i] + data[i+1];
      if (yellow < threshValue) {
        data[i] = data[i+1] = data[i+2] = 0;
      } else {
        data[i] = data[i+1] = data[i+2] = 255;
      }
    }
    
    let ct = contours(id);
    
    ctx.putImageData(id, 0, 0);
    
    if (ct.length) {
      let contour = ct[0];
      for (let i = 1; i < ct.length; i++) {
        if (ct[i].length > contour.length) {
          contour = ct[i];
        }
      }
      outCtx.clearRect(0, 0, canvas.width, canvas.height);
      outCtx.strokeRect(0, 0, 100, 100);
      outCtx.beginPath();
      outCtx.lineWidth = 3;
      outCtx.strokeStyle = '#0f0';
      outCtx.fillStyle= '#rgba(0, 255, 0, .5)';
      
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      
      for (let pos of contour) {
        let x = (pos % sensorWidth) * video.videoWidth / sensorWidth;
        let y = (pos / sensorWidth | 0) * video.videoHeight / sensorHeight;
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
        outCtx.lineTo(x, y);
      }
      outCtx.fill();
      outCtx.strokeRect(minX, minY, maxX-minX, maxY-minY);
    }
    
    setTimeout(frame, 200);
  }
  
  video.addEventListener('play', function () {
    frame();
  });
}

document.querySelector('.app').addEventListener('click', init);

console.log('woooo');