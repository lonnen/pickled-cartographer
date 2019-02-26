/* global contours, CV */

let signatureSize = 64;
let signature = document.createElement('canvas');
signature.width = signatureSize;
signature.height = signatureSize;
document.body.appendChild(signature);
let sigCtx = signature.getContext('2d');

let fullOutput = [];

function inPaint(id) {
  let data = id.data;
  
  const idx = (x, y) => (y * id.width + x) * 4;
  const copyPixel = (id, id2) => {
    data[id2] = data[id];
    data[id2 + 1] = data[id + 1];
    data[id2 + 2] = data[id + 2];
    data[id2 + 3] = data[id + 3];
  }

  for (let i = 0; i < id.width / 2; i++) {
    
  }
}

async function init() {
  let assets = await fetch('/.glitch-assets');
  assets = await assets.text();
  let uuids = {};
  assets.split('\n').forEach(f => {
    try {
      let a = JSON.parse(f);
      if (uuids[a.uuid]) {
        Object.assign(uuids[a.uuid], a);
      } else {
        uuids[a.uuid] = a;
      }
    } catch (e) {
      console.warn('whoops');
    }
  });
  
  let islands = Object.values(uuids).filter(u => !u.deleted);
  let pos = 0;
  
  function next() {
    if (pos >= islands.length) {
      let outEl = document.createElement('pre');
      outEl.innerText = JSON.stringify(fullOutput, null, 2);
      document.querySelector('.data').appendChild(outEl);
      console.log('done!');
      return;
    }
    processIsland(islands[pos]).then(() => {
      pos++;
      setTimeout(next, 0);
    }).catch(e => {
      console.error(e);
      pos++;
      setTimeout(next, 0);
    });
  }
  
  next();
  
  // console.log(assets.split('\n').map(f => JSON.parse(f)));
}

function processIsland(island) {
  return new Promise((resolve, reject) => {
    let img = new Image();
    img.setAttribute('crossorigin', 'anonymous');
    img.addEventListener('load', function () {
      let canvas = document.querySelector('.intake');
      canvas.width = 256;
      canvas.height = 256;
      let ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, 256, 256);
      let id = ctx.getImageData(0, 0, 256, 256);
      let data = CV.lumArray(id);

      let sobel = CV.kernelFilter(data, 256, CV.sobelXKernel);
      let boosted = CV.map(sobel, n => Math.abs(n) > .1 ? 1: 0);
      ctx.putImageData(CV.grayscale(CV.normalize(boosted), 256), 0, 0);

      let contourList = contours(boosted);
      contourList = contourList.filter(c => c.length > 10);
      console.log(contourList);

      if (contourList.length) {
        ctx.beginPath();
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#0f0';
        ctx.fillStyle= '#rgba(0, 255, 0, .5)';

        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        for (let contour of contourList) {
          ctx.beginPath();
          for (let pos of contour) {
            let x = (pos % 256) * 256 / 256;
            let y = (pos / 256 | 0) * 256 / 256;
            if (x < minX) minX = x;
            if (y < minY) minY = y;
            if (x > maxX) maxX = x;
            if (y > maxY) maxY = y;
            ctx.lineTo(x, y);
          }
          ctx.stroke();
        }

        ctx.strokeRect(minX, minY, maxX-minX, maxY-minY);

        minX = minX * img.width / 256;
        maxX = maxX * img.width / 256;
        minY = minY * img.height / 256;
        maxY = maxY * img.height / 256;
        
        let sigSampleSize = Math.max(maxX - minX, maxY - minY);
        let sigCenterX = (minX + maxX) / 2;
        let sigCenterY = (minY + maxY) / 2;
        let sigSampleLeft = sigCenterX - sigSampleSize / 2;
        let sigSampleTop = sigCenterY - sigSampleSize / 2;
        
        sigCtx.clearRect(0, 0, signatureSize, signatureSize);
        sigCtx.drawImage(
          img,
          sigSampleLeft - 16,
          sigSampleTop - 16,
          sigSampleSize + 32,
          sigSampleSize + 32,
          0, 0, signatureSize, signatureSize
        );
        
        let islandData = sigCtx.getImageData(0, 0, signatureSize, signatureSize);
        inPaint(islandData)
        
        let islandSig = CV.lumArray(islandData);
                
        islandSig = CV.kernelFilter(
          CV.lumArray(sigCtx.getImageData(0, 0, signatureSize, signatureSize)),
          signatureSize,
          CV.sobelXKernel
        );
        
        islandSig = CV.normalize(CV.map(islandSig, n => Math.min(1, Math.abs(n) * 3)));
        
        islandSig = CV.lumArray(sigCtx.getImageData(0, 0, signatureSize, signatureSize));
        
        sigCtx.putImageData(CV.grayscale(islandSig, signatureSize), 0, 0);

        let i = new Image();
        i.src = signature.toDataURL();
        i.setAttribute('title', island.name);
        document.querySelector('.thumbs').appendChild(i);
        
        let dataOut = '';
        for (let i = 0; i < islandSig.length; i++) {
          dataOut += String.fromCharCode(islandSig[i]);
        }
        fullOutput.push([island.name.replace('.png',''), btoa(dataOut)]);
        resolve();
      }
    });
    img.onerror = reject;

    img.src=island.url
  });
}


init().catch(e => console.error(e));