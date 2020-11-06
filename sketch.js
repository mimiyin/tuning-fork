// Copyright (c) 2019 ml5
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

/* ===
ml5 Example
Basic Pitch Detection
=== */
let socket = io();
let audioContext;
let mic;
let pitch;

// Keep track of all users
let users = {};

// Where are we drawing the graph right now?
let x = 0;
let y;

// Confirm socket connection
socket.on('connect', function() {
  console.log("Connected");
});

// Keep track of clicks
let started = false;

function setup() {
  createCanvas(windowWidth, windowHeight);

  // Anchor the graph to the middle of the canvas
  y = height / 2;

  // New data
  socket.on('data', function(message) {
    //console.log('data', message);
    let id = message.id;
    let data = message.data;

    // Store last 2 frequencies for each user
    if (id in users) {
      users[id].push(data);
    } else {
      users[id] = [data, data];
    }
    if (users[id].length > 2) {
      let removed = users[id].shift();
      // console.log("REMOVED!", removed, users[id]);
    }
  });

  // Listen for disconnections
  socket.on('disconnected', function(id) {
    console.log(id, ' disconnected.');
    delete users[id];
  });
  textSize(64);
  fill(255);
  background(0);
}

function draw() {

  // Draw each user's data
  for (let u in users) {
    let data = users[u];
    if (data.length >= 2) {
      // Last 2 frequencies
      let start = data[0];
      let end = data[1];
      // If there's sound
      if (start > 0 && end > 0) {
        noFill();
        // My data appears as red
        if (u == socket.id) {
          strokeWeight(10);
          stroke(255, 0, 0)
        }
        else {
          strokeWeight(5);
          stroke(255, 32);
        }
        // Draw a line
        let starty = y + map(start, 0, 1000, height / 2, -height / 2);
        let endy = y + map(end, 0, 1000, height / 2, -height / 2);
        line(x, starty, x + 1, endy);
      }
    }
  }
  // Move across the screen
  x++;
  // Wrap around
  if(x > width) {
    background(0);
    x = 0;
  }

  // Instructions
  if(!started) {
    fill(255);
    text('Click to start.', 20, 70);
  }
}

// Activate the mic with mouse click
function mousePressed() {
  audioContext = getAudioContext();
  mic = new p5.AudioIn();
  mic.start(startPitch);
  started = true;
}

// Activate pitch detection
function startPitch() {
  pitch = ml5.pitchDetection('./model/', audioContext, mic.stream, modelLoaded);
}

// Confirm model successfully loaded.
function modelLoaded() {
  console.log('Model Loaded');
  getPitch();
}

// Get pitch frequency, draw it to canvas and send to server
function getPitch() {
  pitch.getPitch(function(err, freq) {
    noStroke();
    fill(0);
    rect(0, 0, width, 100);
    fill(255);
    let f = floor(freq);
    text(f, 20, 70);
    socket.emit('data', f)
    getPitch();
  })
}
