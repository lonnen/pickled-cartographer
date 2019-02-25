/* global contours */

let sensorWidth = 256;
let sensorHeight = 256;

let signatureSize = 64;

let video = document.querySelector("video");
let hasCapture = false;

let sigs = [];

let app = document.querySelector('.app');

async function init() {
  console.log('click');
  let signatures = await fetch('signatures.json');
  signatures = await signatures.json();
  sigs = signatures.map(s => [s[0], atob(s[1]).split('').map(c => c.charCodeAt(0))]);
  console.log(sigs);
  let stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: { facingMode: "environment" },
  })
  start(stream);
}

function start(stream) {
  video.srcObject = stream;
  video.play();
  
  let outCanvas = document.querySelector('.output');
  let outCtx = outCanvas.getContext('2d');
  
  let canvas = document.createElement('canvas');
  // app.appendChild(canvas);
  canvas.width = sensorWidth;
  canvas.height = sensorHeight;
  
  let signature = document.createElement('canvas');
  signature.width = signatureSize;
  signature.height = signatureSize;
  document.body.appendChild(signature);
  let sigCtx = signature.getContext('2d');

  let smoothSignature = new Uint8ClampedArray(signatureSize * signatureSize);
  smoothSignature.fill(0);

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
    for (let i = 0; i < data.length; i+=4) {
      let yellow = data[i] + data[i+1] / 2 | 0;
      data[i + 2] = yellow;
    }
    
    let { min, max, sobel } = sobelFilter(id);
    
    ctx.putImageData(sobel, 0, 0);
    
    let threshold = .5;
    let threshValue = (max - min) * threshold + min;
    for (let i = 0; i < data.length; i+=4) {
      if (sobel.data[i] > threshValue) {
        sobel.data[i] = sobel.data[i+1] = sobel.data[i+2] = 255;
      } else {
        sobel.data[i] = sobel.data[i+1] = sobel.data[i+2] = 0;
      }
    }
    
    let ct = contours(sobel);
    
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
      outCtx.stroke();
      outCtx.strokeRect(minX, minY, maxX-minX, maxY-minY);
      sigCtx.drawImage(video, minX - 8, minY - 8, maxX - minX + 16, maxY - minY + 16, 0, 0, signatureSize, signatureSize);
      let cameraSig = sobelFilter(sigCtx.getImageData(0, 0, signatureSize, signatureSize)).sobel;
      sigCtx.putImageData(cameraSig, 0, 0);
      
      for (let i = 0; i < smoothSignature.length; i++) {
        smoothSignature[i] = (smoothSignature[i] * .9 + cameraSig.data[i * 4] * .1) | 0;
      }
      
      let scores = sigs.map(([id, sig]) => {
        let score = 0;
        for (let i = 0; i < sig.length; i++) {
          score += Math.abs(sig[i] - smoothSignature[i]);
        }
        return [id, score];
      });
                              
      let topMatches = scores.sort((a, b) => { return a[1] - b[1] });
      document.querySelector('.matches').innerHTML = topMatches.slice(0,3).map(match => {
        return `<li>${match[0]} - ${match[1]}</li>`;
      }).join('\n');
      
    }
    
    setTimeout(frame, 100);
  }
  
  video.addEventListener('play', function () {
    frame();
  });
}

// document.querySelector('.app').addEventListener('click', init);
init().catch(e => console.error(e));

console.log('woooo');