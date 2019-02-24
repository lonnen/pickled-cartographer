function sobelFilter(id) {
  let sobel = new ImageData(id.width, id.height);
  const lum = (id, i) => (id[i] * .299 + id[i + 1] * .587 + id[i + 2] * .114);
  const idx = (x, y) => y * 256 * 4 + x * 4;

  let min = Infinity;
  let max = -Infinity;
  let data = id.data;
  for (let i = 0; i < data.length; i+=4) {
    let x = (i / 4) % id.width;
    let y = (i / 4) / id.width | 0;
    sobel.data[i+3] = 255;
    if (x > 0 && x < id.width - 1 && y > 0 && y < id.height - 1) {
      let l = lum(data, i);
      let valX = Math.floor(Math.abs(
        -1 * lum(data, idx(x - 1, y - 1)) + 1 * lum(data, idx(x + 1, y - 1)) +
        -2 * lum(data, idx(x - 1, y)) + 2 * lum(data, idx(x + 1, y)) +
        -1 * lum(data, idx(x - 1, y + 1)) + 1 * lum(data, idx(x + 1, y + 1))
      ));
      let valY = Math.floor(Math.abs(
        -1 * lum(data, idx(x - 1, y - 1)) + -2 * lum(data, idx(x, y - 1)) + -1 * lum(data, idx(x + 1, y - 1)) +
        1 * lum(data, idx(x - 1, y + 1)) + 2 * lum(data, idx(x, y + 1)) + 1 * lum(data, idx(x + 1, y + 1))
      ));
      let val = Math.max(0, Math.min(valX + valY / 2 | 0, 255));
      if (val > max) max = val;
      if (val < min) min = val;
      sobel.data[i] = sobel.data[i + 1] = sobel.data[i + 2] = val;
    } else {
      sobel.data[i] = sobel.data[i + 1] = sobel.data[i + 2] = 0;
    }
  }
  return { min, max, sobel }
}

function idToBase64(id) {
  console.log(id.data);
  return btoa(Array.prototype.map.call(id.data, byte => String.fromCharCode(byte)).join(''));
}