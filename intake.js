/ * global contours, sobelFilter */

let signatureSize = 64;
let signature = document.createElement('canvas');
signature.width = signatureSize;
signature.height = signatureSize;
document.body.appendChild(signature);
let sigCtx = signature.getContext('2d');

async function init() {
  let assets = await fetch('/.glitch-assets');
  assets = await assets.text();
  assets.split('\n').forEach(f => console.log(f));
  
  // console.log(assets.split('\n').map(f => JSON.parse(f)));
}

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
  console.log(max, min, threshValue);
  for (let i = 0; i < data.length; i+=4) {
    if (sobel.data[i] > threshValue) {
      sobel.data[i] = sobel.data[i+1] = sobel.data[i+2] = 255;
    } else {
      sobel.data[i] = sobel.data[i+1] = sobel.data[i+2] = 0;
    }
  }

  // ctx.putImageData(sobel, 0, 0);

  let ct = contours(sobel);

  console.log(ct);
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
    sigCtx.putImageData(sobelFilter(sigCtx.getImageData(0, 0, signatureSize, signatureSize)).sobel, 0, 0);
    let i = new Image();
    i.src = signature.toDataURL();
    document.body.appendChild(i);
  }

});

img.src="https://cdn.glitch.com/4945918e-6ab3-4a5c-8549-71e001d5a0e8%2Fi-4.png?1550996601524";

init().catch(e => console.error(e));