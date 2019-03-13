const CV = (function () {
  const sobelXKernel = [
    -1, 0, 1,
    -2, 0, 2,
    -1, 0, 1
  ];

  const sobelYKernel = [
    -1, -2, -1,
    0, 0, 0,
    1, 2, 1
  ];

  function lumArray(id) {
    const output = new Float32Array(id.width * id.height);

    const lum = (id, i) => (id[i] * .299 + id[i + 1] * .587 + id[i + 2] * .114) / 255;
    const idx = (x, y) => (y * id.width + x) * 4;

    let data = id.data;
    for (let i = 0; i < output.length; i++) {
      let x = i % id.width;
      let y = i / id.width | 0;
      let val = lum(data, idx(x, y));
      output[i] = val;
    }
    return output;
  }

  function kernelFilter(data, size, k) {
    const idx = (x, y) => y * size + x;
    const output = new Float32Array(size * size);

    for (let i = 0; i < output.length; i++) {
      let x = i % size;
      let y = i / size | 0;
      if (x > 0 && x < size - 2 && y > 0 && y < size - 2) {
        let val = (
          k[0] * data[idx(x - 1, y - 1)] +
          k[1] * data[idx(x + 0, y - 1)] +
          k[2] * data[idx(x + 1, y - 1)] +
          k[3] * data[idx(x - 1, y + 0)] +
          k[4] * data[idx(x + 0, y + 0)] +
          k[5] * data[idx(x + 1, y + 0)] +
          k[6] * data[idx(x - 1, y + 1)] +
          k[7] * data[idx(x + 0, y + 1)] +
          k[8] * data[idx(x + 1, y + 1)]
        );
        output[i] = val;
      } else {
        output[i] = 0;
      }
    }
    return output;
  }


  function normalize(data) {
    const output = new Float32Array(data.length);
    let min = Infinity;
    let max = -Infinity;
    for (let i = 0; i < data.length; i++) {
      if (data[i] < min) min = data[i];
      if (data[i] > max) max = data[i];
    }
    let range = max - min;
    for (let i = 0; i < data.length; i++) {
      output[i] = (data[i] - min) / range;
    }
    return output;
  }

  function grayscale(data, size) {
    let id = new ImageData(size, size);
    for (let i = 0; i < id.data.length; i += 4) {
      id.data[i] = id.data[i + 1] = id.data[i + 2] = Math.max(0, Math.min(data[i / 4] * 255, 255)) | 0;
      id.data[i + 3] = 255;
    }
    return id;
  }

  function map(data, fn) {
    let out = new Float32Array(data.length);
    for (let i = 0; i < data.length; i++) {
      out[i] = fn(data[i]);
    }
    return out;
  }
  
  return {
    sobelXKernel, sobelYKernel,
    lumArray, map, grayscale,
    normalize, kernelFilter
  };
})();