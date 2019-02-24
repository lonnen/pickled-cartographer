/ * global contours */

let img = new Image();
img.setAttribute('crossorigin', 'anonymous');
img.addEventListener('load', function () {
  let canvas = document.querySelector('canvas');
  canvas.width = 256;
  canvas.height = 256;
  let ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, 256, 256);
  let id = ctx.getImageData(0, 0, 256, 256);
  let sobel = new ImageData(256, 256);
  let data = id.data;

  const lum = (id, i) => (id[i] * .299 + id[i + 1] * .587 + id[i + 2] * .114);
  const idx = (x, y) => y * 256 * 4 + x * 4;

  // the meat
  let min = Infinity;
  let max = 0;
  for (let i = 0; i < data.length; i+=4) {
    let x = (i / 4) % 256;
    let y = (i / 4) / 256 | 0;
    sobel.data[i+3] = 255;
    if (x > 0 && x < 255 && y > 0 && y < 255) {
      let l = lum(data, i);
      let val = Math.floor(Math.abs(
        -1 * lum(data, idx(x - 1, y - 1)) + 1 * lum(data, idx(x + 1, y - 1)) +
        -2 * lum(data, idx(x - 1, y)) + 2 * lum(data, idx(x + 1, y)) +
        -1 * lum(data, idx(x - 1, y + 1)) + 1 * lum(data, idx(x + 1, y + 1))
      ));
      if (val > max) max = val;
      if (val < min) min = val;
      sobel.data[i] = sobel.data[i + 1] = sobel.data[i + 2] = val;
    } else {
      sobel.data[i] = sobel.data[i + 1] = sobel.data[i + 2] = 0;
    }
  }

  console.log(sobel);

  // let threshold = .90;
  // console.log(min, max);
  // let threshValue = (max - min) * threshold + min;
  // for (let i = 0; i < data.length; i+=4) {
  //   let blue = data[i] + data[i+1];
  //   if (blue > threshValue) {
  //     data[i] = data[i+1] = data[i+2] = 0;
  //   } else {
  //     data[i] = data[i+1] = data[i+2] = 255;
  //   }
  // }

  let ct = contours(sobel);
  ctx.putImageData(sobel, 0, 0);

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
    // ctx.strokeRect(minX, minY, maxX-minX, maxY-minY);
  }

});

img.src="https://cdn.glitch.com/4945918e-6ab3-4a5c-8549-71e001d5a0e8%2Fb9-crescent-isle.png?1550987729191";
