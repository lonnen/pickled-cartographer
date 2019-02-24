/ * global contours, sobelFilter */

let signatureSize = 64;
let signature = document.createElement('canvas');
signature.width = signatureSize;
signature.height = signatureSize;
document.body.appendChild(signature);
let sigCtx = signature.getContext('2d');


let img = new Image();
img.setAttribute('crossorigin', 'anonymous');
img.addEventListener('load', function () {
  let canvas = document.querySelector('canvas');
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
    let cx = Math.max(0, minX - 8);
    let cy = Math.max(0, minY - 8);
    let cw = Math.min(maxX + 8, img.width) - cx;
    let ch = Math.min(maxY + 8, img.height) - cy;
    sigCtx.drawImage(img, cx, cy, cw, ch, 0, 0, signatureSize, signatureSize);
  }

});

img.src="https://cdn.glitch.com/4945918e-6ab3-4a5c-8549-71e001d5a0e8%2Fo-9.png?1550992687882";
