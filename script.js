/* global CV, Camera, contours */
if (window.location.protocol !== "https:") {
  window.location = "https://" + window.location.hostname;
}

let sensorSize = 256;
let signatureSize = 64;

let sigs = [];
let islands;

let app = document.querySelector(".app");
let camera = new Camera(document.querySelector(".live-feed"));
let outCanvas = document.querySelector(".output");

async function init() {
  let signatures = await fetch("data/signatures.json");
  signatures = await signatures.json();
  sigs = signatures.map((s) => [
    s[0],
    atob(s[1])
      .split("")
      .map((c) => c.charCodeAt(0)),
  ]);

  let islandsRequest = await fetch("data/islands.json");
  islands = (await islandsRequest.json()).islands;
}

// start loading data files early, block on it later
let initialization = init();

// need user input to get a camera feed on iOS
outCanvas.addEventListener("click", function () {
  if (camera.initialized) {
    return;
  }
  console.log("click");
  camera
    .init()
    .then(initialization)
    .then(start)
    .catch((e) => console.error(e));
});

function start(stream) {
  let outCanvas = document.querySelector(".output");
  let outCtx = outCanvas.getContext("2d");
  let video = camera.video;

  app.addEventListener("click", function () {
    camera.flip();
  });

  let canvas = document.createElement("canvas");

  canvas.width = sensorSize;
  canvas.height = sensorSize;

  let signature = document.createElement("canvas");
  signature.classList.add("signature");
  signature.width = signatureSize;
  signature.height = signatureSize;

  //app.appendChild(signature);
  let sigCtx = signature.getContext("2d");

  let smoothSignature = new Float32Array(signatureSize * signatureSize);
  smoothSignature.fill(0);

  let ctx = canvas.getContext("2d");

  let grayBuffer = new Float32Array(sensorSize * sensorSize);
  let kernelBuffer = new Float32Array(sensorSize * sensorSize);
  let alphaBuffer = new Uint8ClampedArray(sensorSize * sensorSize);

  function frame() {
    let sampleSize = Math.min(video.videoWidth, video.videoHeight) * 0.75;
    let sampleX = video.videoWidth / 2 - sampleSize / 2;
    let sampleY = video.videoHeight / 2 - sampleSize / 2;

    outCanvas.width = video.videoWidth;
    outCanvas.height = video.videoHeight;

    outCtx.clearRect(0, 0, canvas.width, canvas.height);
    outCtx.strokeStyle = "#0ff";
    outCtx.strokeRect(sampleX, sampleY, sampleSize, sampleSize);

    ctx.drawImage(
      video,
      sampleX,
      sampleY,
      sampleSize,
      sampleSize,
      0,
      0,
      sensorSize,
      sensorSize
    );

    let pixelData = CV.lumArray(ctx.getImageData(0, 0, sensorSize, sensorSize));
    ctx.putImageData(CV.grayscale(pixelData, sensorSize), 0, 0);

    let sobel = CV.kernelFilter(pixelData, sensorSize, CV.sobelXKernel);
    sobel = CV.kernelFilter(sobel, sensorSize, CV.sobelYKernel);
    let boosted = CV.map(sobel, (n) => (Math.abs(n) > 0.3 ? 1 : 0));
    ctx.putImageData(CV.grayscale(CV.normalize(boosted), sensorSize), 0, 0);

    let contourList = contours(boosted, sensorSize);
    contourList = contourList.filter((c) => c.length > 150);

    if (contourList.length) {
      outCtx.beginPath();
      outCtx.lineWidth = 3;
      outCtx.strokeStyle = "#0f0";
      outCtx.fillStyle = "#rgba(0, 255, 0, .5)";

      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;

      for (let contour of contourList) {
        outCtx.beginPath();
        for (let pos of contour) {
          let x = ((pos % sensorSize) * sampleSize) / sensorSize;
          let y = (((pos / sensorSize) | 0) * sampleSize) / sensorSize;
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
          outCtx.lineTo(sampleX + x, sampleY + y);
        }
        outCtx.stroke();
      }

      let sigSampleSize = Math.max(maxX - minX, maxY - minY);
      let sigCenterX = (minX + maxX) / 2;
      let sigCenterY = (minY + maxY) / 2;
      let sigSampleLeft = sigCenterX - sigSampleSize / 2;
      let sigSampleTop = sigCenterY - sigSampleSize / 2;

      sigCtx.drawImage(
        video,
        sampleX + sigSampleLeft - 8,
        sampleY + sigSampleTop - 8,
        sigSampleSize + 16,
        sigSampleSize + 16,
        0,
        0,
        signatureSize,
        signatureSize
      );

      let cameraSig = CV.kernelFilter(
        CV.lumArray(sigCtx.getImageData(0, 0, signatureSize, signatureSize)),
        signatureSize,
        CV.sobelXKernel
      );

      cameraSig = CV.map(cameraSig, (n) => Math.min(1, Math.abs(n) * 3));

      for (let i = 0; i < smoothSignature.length; i++) {
        smoothSignature[i] = smoothSignature[i] * 0.9 + cameraSig[i] * 0.1;
      }

      sigCtx.putImageData(
        CV.grayscale(CV.normalize(smoothSignature), signatureSize),
        0,
        0
      );

      let scores = sigs.map(([id, sig]) => {
        let score = 0;
        for (let i = 0; i < sig.length; i++) {
          score += Math.abs(sig[i] - smoothSignature[i]);
        }
        return [id, score];
      });

      let topMatches = scores.sort((a, b) => {
        return a[1] - b[1];
      });
      document.querySelector(".matches").innerHTML = topMatches
        .slice(0, 3)
        .map((match, i) => {
          let island = islands[match[0]];
          if (i === 0) {
            populateIslandPreview(match[0]);
          }
          return `<li>${island.name} - ${
            match[0]
          } - <span class="confidence" style="width:${
            (topMatches[i + 1][1] - match[1]) | 0
          }px;"></span></li>`;
        })
        .join("\n");
    }

    setTimeout(frame, 50);
  }
  frame();
}

let populateIslandPreview = (function () {
  let lastIsland = "";
  return function (island) {
    if (island === lastIsland) {
      return;
    }
    document.querySelector(
      ".match"
    ).style.backgroundImage = `url(https://cdn.glitch.com/4945918e-6ab3-4a5c-8549-71e001d5a0e8%2F${island}.png)`;
  };
})();
