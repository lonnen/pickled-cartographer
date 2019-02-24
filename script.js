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
  
  let outCanvas = document.querySelector('.out');
  outCanvas.width = 
  
  
  let canvas = document.createElement('canvas');
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
      }
    }
    
    let ct = contours(id);
    
    ctx.putImageData(id, 0, 0);
    
    if (ct.length) {
      ctx.beginPath();
      ctx.strokeStyle = '#0f0';
      for (let pos of ct[0]) {
        let x = (pos % sensorWidth) * video.videoWidth / sensorWidth;
        ctx.lineTo(pos % sensorWidth, pos / sensorWidth | 0);
      }
      ctx.stroke();
    }
    
    setTimeout(frame, 1000);
  }
  frame();
}).catch(e => console.error(e));
