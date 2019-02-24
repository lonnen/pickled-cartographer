/* global contours */

let sensorWidth = 256;
let sensorHeight = 256;

navigator.mediaDevices.getUserMedia({
  audio: false,
  video: true
}).then(function(stream) {
  let video = document.querySelector("video");
  video.srcObject = stream;
  video.onloadedmetadata = function(e) {
    video.play();
  }
  
  let outCanvas = document.querySelector('.output');
  let outCtx = outCanvas.getContext('2d');
  
  let canvas = document.createElement('canvas');
  document.body.appendChild(canvas);
  canvas.width = sensorWidth;
  canvas.height = sensorHeight;
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
      outCtx.clearRect(0, 0, canvas.width, canvas.height);
      outCtx.strokeRect(0, 0, 100, 100);
      outCtx.beginPath();
      outCtx.lineWidth = 3;
      outCtx.strokeStyle = '#0f0';
      for (let pos of ct[0]) {
        let x = (pos % sensorWidth) * video.videoWidth / sensorWidth;
        let y = (pos / sensorWidth | 0) * video.videoHeight / sensorHeight;
        outCtx.lineTo(x, y);
      }
      outCtx.stroke();
    }
    
    setTimeout(frame, 500);
  }
  frame();
}).catch(e => console.error(e));
