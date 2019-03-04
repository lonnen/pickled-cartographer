The Pickled Cartographer
========================

Identify island maps in Sea of Thieves using a second device!


In Sea of Thieves you can retrieve in-game treasure maps that describe only the shape of the island and the location of treasure. Players are expected to use their shipboard maps to identify these islands. The Pickled Cartographer uses WebRTC and some rudimentary computer vision techniques to identify treasure maps in Sea of Thieves. Since this relies on camera input data, the application was designed with Mobile Safari in mind.


The Project
------------

### ← README.md

That's this file, where you can tell people what your cool website does and how you built it.

### ← index.html

The primary application

### ← camera.js

A reusable getUserMedia-based camera class for mobile devices. You could probably use this in another project with minimal modification.

### ← contours.js

A relatively simple edge detection function

### ← intake.html

A developer page that pre-processes images of every island in the assets folder and produces a set of 'signatures' intended to be manually copied into the 'signatures.json' blob.

This should be done every time a change is made to the image processing code.

### ← islands.json

A dictionary of island metadata in the format {coordinate: {name:, type:, cat:}...}. Current as of the SoT 1.4.3 patch.

### ← process.js

Defines several Computer Vision and image manipulation functions, including our Sobel filter.

### ← script.js

The workhorse script

### ← signatures.json

### ← style.css



### ← watch.json

This file describes custom rules for when to restart which files during development. It is used by [Glitch](glitch.com) to manage container behavior. Read more about how to use it [here](https://glitch.com/edit/#!/watch-json).

### ← [assets]

Assets for this project include images of every island in the game named with their primary grid-square. Images were manually captured from the master map, cropped, labelled, and edited to remove cartographic embelleshments (waves, grid lines, etc).