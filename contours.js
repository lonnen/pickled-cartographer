(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global.contours = factory());
}(this, (function () { 'use strict';

var traceContour = function (imageData, i) {

  var start = i;
  var contour = [start];

  var direction = 3;
  var p = start;

  while(true) {

    var n = neighbours(imageData, p, 0);

    // find the first neighbour starting from
    // the direction we came from
    var offset = direction - 3 + 8;
    /*
    directions:
      0   1   2
      7       3
      6   5   4

    start indexes:
      5  6   7
      4      0
      3  2   1
    */

    direction = -1;
    for (var idx = (void 0), i$1 = 0; i$1 < 8; i$1++) {
      idx = (i$1 + offset) % 8;

      if(imageData.data[n[idx] * 4] > 0) {
        direction = idx;
        break
      }
    }

    p = n[direction];

    if(p === start || !p) {
      break
    } else {
      contour.push(p);
    }

  }

  return contour
};


// list of neighbours to visit
var neighbours = function (image, i, start) {
  var w = image.width;

  var mask = [];

  if((i % w) === 0) {
    mask[0] = mask[6] = mask[7] = -1;
  }

  if(((i+1) % w) === 0) {
    mask[2] = mask[3] = mask[4] = -1;
  }

  // hack - vertical edging matters less because
  // it will get ignored by matching it to the source

  return offset([
    mask[0] || i - w - 1,
    mask[1] || i - w,
    mask[2] || i - w + 1,
    mask[3] || i + 1,
    mask[4] || i + w + 1,
    mask[5] || i + w,
    mask[6] || i + w - 1,
    mask[7] || i - 1
  ], start)
};

var offset = function (array, by) { return array.map( function (_v, i) { return array[(i + by) % array.length]; }
  ); };


function contourFinder (imageData) {

  var contours = [];
  var seen = [];
  var skipping = false;

  for (var i = 0; i < imageData.data.length; i++) {

    if(imageData.data[i * 4] > 128) {
      if(seen[i] || skipping) {
        skipping = true;

      } else {
        var contour = traceContour(imageData, i);

        contours.push(contour);

        // this could be a _lot_ more efficient
        contour.forEach(function (c) {
          seen[c] = true;
        });

      }

    } else {
      skipping = false;
    }
  }

  return contours

}


// export for testing
contourFinder._ = {traceContour: traceContour, neighbours: neighbours, offset: offset};

return contourFinder;

})));
