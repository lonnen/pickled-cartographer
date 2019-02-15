
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
  function frame() {
    ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight, 0, 0, canvas.width, canvas.height);
    requestAnimationFrame(frame);
  }
  frame();
}).catch(e => console.error(e));
