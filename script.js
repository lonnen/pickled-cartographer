let sensorWidth = 640;
let sensorHeight = 360;

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
  canvas.width = sensorWidth;
  canvas.height = sensorHeight;
  let ctx = canvas.getContext('2d');
  let grayBuffer = new Float32Array(sensorWidth * sensorHeight);
  let kernelBuffer = new Float32Array(sensorWidth * sensorHeight);

  let alphaBuffer = new Uint8ClampedArray(sensorWidth * sensorHeight);
  function frame() {
    ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight, 0, 0, sensorWidth, sensorHeight);
    let id = ctx.getImageData(0, 0, sensorWidth, sensorHeight);
    let data = id.data;
    
    // the meat
    let max = 0;
    for (let i = 0; i < data.length; i+=4) {
      let yellow = data[i] + data[i+1];
      data[i+2] = 0;
    }
    
    ctx.putImageData(id, 0, 0);
    requestAnimationFrame(frame);
  }
  frame();
}).catch(e => console.error(e));
