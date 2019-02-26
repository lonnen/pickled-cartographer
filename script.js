/* global CV, Camera, contours */
if (window.location.protocol !== 'https:') {
  window.location = 'https://' + window.location.hostname;
}

let sensorSize = 256;

let signatureSize = 64;

let camera = new Camera();
let pre = document.querySelector('pre');

let sigs = [];
let islands;

let app = document.querySelector('.app');
app.appendChild(camera.video);

async function init() {
  let signatures = await fetch('signatures.json');
  signatures = await signatures.json();
  sigs = signatures.map(s => [s[0], atob(s[1]).split('').map(c => c.charCodeAt(0))]);
  
  let islandsRequest = await fetch('islands.json');
  islands = (await islandsRequest.json()).islands;
}

document.querySelector('button').addEventListener('click', function () {
  console.log('click');
  camera.init().then(start);
});

function start(stream) {
  let outCanvas = document.querySelector('.output');
  let outCtx = outCanvas.getContext('2d');
  let video = camera.video;
  
  app.addEventListener('click', function () {
    camera.flip();
  });
  
  let canvas = document.createElement('canvas');
  document.body.appendChild(canvas);
  canvas.width = sensorSize;
  canvas.height = sensorSize;
  
  let signature = document.createElement('canvas');
  signature.width = signatureSize;
  signature.height = signatureSize;
  document.body.appendChild(signature);
  let sigCtx = signature.getContext('2d');

  let smoothSignature = new Uint8ClampedArray(signatureSize * signatureSize);
  smoothSignature.fill(0);

  let ctx = canvas.getContext('2d');
  let grayBuffer = new Float32Array(sensorSize * sensorSize);
  let kernelBuffer = new Float32Array(sensorSize * sensorSize);

  let alphaBuffer = new Uint8ClampedArray(sensorSize * sensorSize);
  function frame() {
    let sampleSize = Math.min(video.videoWidth, video.videoHeight) * .75;
    let sampleX = video.videoWidth / 2 - sampleSize / 2;
    let sampleY = video.videoHeight / 2 - sampleSize / 2;
    
    outCanvas.width = video.videoWidth;
    outCanvas.height = video.videoHeight;
    
    outCtx.clearRect(0, 0, canvas.width, canvas.height);
    outCtx.strokeStyle = '#00f';
    outCtx.strokeRect(sampleX, sampleY, sampleSize, sampleSize);
    outCtx.beginPath();
    outCtx.lineWidth = 3;
    outCtx.strokeStyle = '#0f0';
    outCtx.fillStyle= '#rgba(0, 255, 0, .5)';

    ctx.drawImage(video, sampleX, sampleY, sampleSize, sampleSize, 0, 0, sensorSize, sensorSize);
    
    let pixelData = CV.lumArray(ctx.getImageData(0, 0, sensorSize, sensorSize));
    ctx.putImageData(CV.grayscale(pixelData, sensorSize), 0, 0);
    
    let sobel = CV.kernelFilter(pixelData, sensorSize, CV.sobelXKernel);
    sobel = CV.kernelFilter(sobel, sensorSize, CV.sobelYKernel);
    let boosted = CV.map(sobel, n => Math.min(1, Math.abs(n)) > .5 ? 1: 0);
    ctx.putImageData(CV.grayscale(CV.normalize(boosted), sensorSize), 0, 0);
        
    let ct = contours(boosted, sensorSize);
    ct = ct.filter(c => c.length > 400);
    
    if (ct.length) {
      let contour = ct[0];
      for (let i = 1; i < ct.length; i++) {
        if (ct[i].length > contour.length) {
          contour = ct[i];
        }
      }
      console.log(contour.length);
      
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      
      for (let pos of contour) {
        let x = (pos % sensorSize) * sampleSize / sensorSize;
        let y = (pos / sensorSize | 0) * sampleSize / sensorSize;
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
        outCtx.lineTo(sampleX + x, sampleY + y);
      }
      outCtx.stroke();
      
      /*
      sigCtx.drawImage(video, sampleX + minX - 8, sampleY + minY - 8, maxX - minX + 16, maxY - minY + 16, 0, 0, signatureSize, signatureSize);
      let cameraSig = normalize(sobelFilter(sigCtx.getImageData(0, 0, signatureSize, signatureSize)));
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
        let island = islands[match[0]];
        return `<li>${island.name} - ${match[0]} - ${match[1]}</li>`;
      }).join('\n');
      */
      
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