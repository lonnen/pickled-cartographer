let sensorWidth = 128;
let sensorHeight = 128;

navigator.mediaDevices.getUserMedia({
  audio: false,
  video: {
    width: 1280,
    height: 720
  }
}).then(function(stream) {
  let video = document.createElement("video");
  document.body.appendChild(video);
  video.srcObject = stream;
  video.onloadedmetadata = function(e) {
    video.play();
  }
  
  let canvas = document.querySelector('canvas');
  let ctx = canvas.getContext('2d');
  let grayBuffer = new Uint8ClampedArray(sensorWidth * sensorHeight);
  grayBuffer.fill(0);
  console.log(grayBuffer);
  let alphaBuffer = new Uint8ClampedArray(sensorWidth * sensorHeight);
  function frame() {
    ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight, 0, 0, sensorWidth, sensorHeight);
    let id = ctx.getImageData(0, 0, 128, 128);
    let data = id.data;
    for (let i = 0; i < data.length; i += 4) {
      let y = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      let grayIdx = i / 4;
      let diff = 
      data[i+3] = (Math.max(0, Math.min(Math.abs(y - grayBuffer[grayIdx])), 32) * 4) | 0;
      grayBuffer[grayIdx] = (grayBuffer[grayIdx] * .9 + y * .1) | 0; 
    }
    ctx.putImageData(id, 0, 0);
    requestAnimationFrame(frame);
  }
  frame();
}).catch(e => console.error(e));
