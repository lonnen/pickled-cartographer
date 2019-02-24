/ * global contours, sobelFilter */

let signatureSize = 64;
let signature = document.createElement('canvas');
signature.width = signatureSize;
signature.height = signatureSize;
document.body.appendChild(signature);
let sigCtx = signature.getContext('2d');

let fullOutput = [];

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
      console.error(e)
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
      let data = id.data;

      let { min, max, sobel } = sobelFilter(id);
      // ctx.putImageData(sobel, 0, 0);

      let threshold = .1;
      let threshValue = (max - min) * threshold + min;
      for (let i = 0; i < data.length; i+=4) {
        if (sobel.data[i] > threshValue) {
          sobel.data[i] = sobel.data[i+1] = sobel.data[i+2] = 255;
        } else {
          sobel.data[i] = sobel.data[i+1] = sobel.data[i+2] = 0;
        }
      }

      // ctx.putImageData(sobel, 0, 0);

      let ct = contours(sobel);

      if (ct.length) {
        let contour = ct[0];
        for (let i = 1; i < ct.length; i++) {
          if (ct[i].length > contour.length) {
            contour = ct[i];
          }
        }
        ctx.beginPath();
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#0f0';

        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        for (let pos of contour) {
          let x = pos % 256;
          let y = pos / 256 | 0;
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.strokeRect(minX, minY, maxX-minX, maxY-minY);
        let cx = Math.max(0, minX * img.width / 256 - 8);
        let cy = Math.max(0, minY * img.height / 256 - 8);
        let cw = Math.min(maxX * img.width / 256 + 8, img.width) - cx;
        let ch = Math.min(maxY * img.height / 256 + 8, img.height) - cy;
        sigCtx.drawImage(img, cx, cy, cw, ch, 0, 0, signatureSize, signatureSize);
        let islandSig = sobelFilter(sigCtx.getImageData(0, 0, signatureSize, signatureSize)).sobel;
        sigCtx.putImageData(islandSig, 0, 0);

        let i = new Image();
        i.src = signature.toDataURL();
        i.setAttribute('title', island.name);
        document.querySelector('.thumbs').appendChild(i);
        
        let dataOut = '';
        for (let i = 0; i < islandSig.data.length; i+=4) {
          dataOut += String.fromCharCode(islandSig.data[i]);
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