//Get dom element with id bg_animation

var bg_animation = document.getElementById('bg_animation');
bg_animation.width = window.innerWidth;
bg_animation.height = window.innerHeight;

//Get the context of the canvas
var ctx = bg_animation.getContext('2d');
//get the width and height of the canvas

class CandleData {
  constructor(array) {
    this.volume = array.length;
    this.open = array[0];
    this.close = array[this.volume - 1];
    this.high = Math.max(...array);
    this.low = Math.min(...array);
    this.data = array;
  }
}

function random_values(old_value, n) {
  //Create a vector of random values
  var vector = new Array(n);
  for (var i = 0; i < n; i++) {
    if  (i > 0) {
      old_value = vector[i-1];
      vector[i] = old_value + Math.random() * 20 - 10;
    } else {
      vector[i] = old_value + Math.random() * 20 - 10;
    }
  }
  return vector;
}

function create_new_candle(old_close, n) {
  //Create a new candle
  var new_candle = new CandleData(random_values(old_close, n));
  return new_candle;
}

function new_center(sim) {
  var center = 0;
  for (var i = 0; i < sim.candles.length; i++) {
    center += sim.candles[i].close;
  }
  return center / sim.candles.length;

}



class simulation {
  constructor() {
    this.max_height = 500;
    this.max_width = 500;
    this.screen_height = bg_animation.height
    this.screen_width = bg_animation.width
    this.candle_width = 10;
    this.candles = [create_new_candle(100, 10)];
    this.center = new_center(this);
    this.max_candles = Math.floor((this.max_width / this.candle_width) * 3/4);
  }
}


function x_to_screen(sim, x) {
  return x * (sim.screen_width / sim.max_width);
}
function y_to_screen(sim, y) {
  return y * (sim.screen_height / sim.max_height);
}

function translate_to_screen(sim, coords) {
  return {
    x: x_to_screen(sim, coords.x),
    y: y_to_screen(sim, coords.y)
  };

}

function center_coords(sim, coords) {
  delta = (sim.max_height / 2) - sim.center
  return {
    x: coords.x,
    y: coords.y + delta
  };
}


sim = new simulation();
console.log(sim);

function draw_line(sim, start_cords, end_coords) {

  var start_pos = translate_to_screen(sim, start_cords);
  var end_pos = translate_to_screen(sim, end_coords);

  var ctx = bg_animation.getContext('2d');
  ctx.beginPath();
  ctx.moveTo(start_pos.x, start_pos.y);
  ctx.lineTo(end_pos.x, end_pos.y);
  ctx.stroke();
}

draw_line(sim, { x: 0, y: 0 }, { x: 500, y: 500 });
draw_line(sim, { x: 0, y: 500 }, { x: 500, y: 0 });

function draw_box(sim, top_left, bottom_right) {

  var ctx = bg_animation.getContext('2d');

  if (top_left.y > bottom_right.y) {
    ctx.fillStyle = 'red';
  } else {
    ctx.fillStyle = 'green';
  }


  var top_left_screen = translate_to_screen(sim, top_left);
  var bottom_right_screen = translate_to_screen(sim, bottom_right);
  var height = bottom_right_screen.y - top_left_screen.y; 
  var width = bottom_right_screen.x - top_left_screen.x;

  ctx.fillRect(top_left_screen.x, top_left_screen.y, width, height);
}

//print the horizontal center in the middle of the screen just the number


function draw_candle(sim, candle, i) {
  cntr = sim.center;

  top_left = {x: i*sim.candle_width, y: candle.open};
  bottom_right = {x: (i+1) * sim.candle_width, y: candle.close};
  draw_box(sim, center_coords(sim, top_left), center_coords(sim, bottom_right));

  line_x = (i*sim.candle_width) + sim.candle_width / 2;
  draw_line(sim, center_coords(sim, {x: line_x, y: candle.high}), center_coords(sim, {x: line_x, y: candle.low}));

  // draw vertical bars at the top and bottom of the candle
  // first line
  b1 = {x: i*sim.candle_width + sim.candle_width / 4, y: candle.high};
  b2 = {x: i*sim.candle_width + sim.candle_width * 3 / 4, y: candle.high};
  draw_line(sim, center_coords(sim, b1), center_coords(sim, b2));

  d1 = {x: i*sim.candle_width + sim.candle_width / 4, y: candle.low};
  d2 = {x: i*sim.candle_width + sim.candle_width * 3 / 4, y: candle.low};
  draw_line(sim, center_coords(sim, d1), center_coords(sim, d2));

}





function draw_candles(sim) {
  ctx = bg_animation.getContext('2d');
  ctx.clearRect(0, 0, sim.screen_width, sim.screen_height);
  candles = sim.candles;
  for (var i = 0; i < candles.length; i++) {
    draw_candle(sim, candles[i], i);
    //ctx.fillRect(x, y, width, height);
  }
}

function add_candle(sim) {
  while (sim.candles.length > sim.max_candles) {
    sim.candles.shift();
  }
  sim.candles.push(create_new_candle(sim.candles[sim.candles.length - 1].close, 10));
}






function animate() {
  //Check if windows has been resized
  sim.center = new_center(sim);
  draw_candles(sim);
  add_candle(sim);

  // Adjust the speed of the animation
  const speed = 1000 / 5; // 60 frames per second
  setTimeout(() => {
    requestAnimationFrame(animate);
  }, speed);
}

// Start animation
animate();

