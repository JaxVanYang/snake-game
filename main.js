/* || Global Constants */
const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

const blockSize = 20;
const rows = 30;
const cols = 30;
const width = canvas.width = rows * blockSize;
const height = canvas.height = cols * blockSize;

const bgColor = 'black';
const snakeHeadColor = 'orange';
const snakeBodyColor = 'green';
const foodColor = 'red';

// helper constants for direction
const kUp = 0;
const kDown = 1;
const kLeft = 2;
const kRight = 3;
const kDx = [0, 0, -1, 1];
const kDy = [-1, 1, 0, 0];

// DOM constants
const paraHighestScore = document.getElementById('highest-score');
const paraScore = document.getElementById('score');

/* || Helper Functions */
function random(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomColor() {
  return `rgb(${randomColor(0, 255)}, ${randomColor(0, 255)}, ${randomColor(0, 255)})`;
}

/* || Classes */
class Block {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.color = color;
  }

  draw() {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x * blockSize, this.y * blockSize, blockSize, blockSize);
  }
}

class Food extends Block {
  constructor(x, y) {
    super(x, y, foodColor);
  }
}

class Snake {
  #controller;
  #lastMove; // record last move direction

  constructor(x, y, direction) {
    this.direction = direction;
    const verse = direction ^ 1;
    this.body = [
      new Block(x, y, snakeHeadColor),
      new Block(x + kDx[verse], y + kDy[verse], snakeBodyColor),
    ];

    this.#controller = new AbortController();
    this.#lastMove = direction;
  }

  draw() {
    for (const block of this.body) {
      block.draw();
    }
  }

  // return next position
  next() {
    return {
      x: this.body[0].x + kDx[this.direction],
      y: this.body[0].y + kDy[this.direction],
    };
  }

  // return true if snake can move
  checkMove() {
    const { x, y } = this.next();
    if (x < 0 || x >= rows || y < 0 || y >= cols) {
      return false;
    }

    // snake can't eat the first 4 blocks
    for (let i = 4; i < this.body.length; ++i) {
      if (this.body[i].x === x && this.body[i].y === y) {
        return false;
      }
    }

    return true;
  }

  // return true if snake eats food
  eatFood(food) {
    const { x, y } = this.next();
    if (x === food.x && y === food.y) {
      return true;
    }
    return false;
  }

  // must checkNext() first
  extend() {
    const { x, y } = this.next();
    this.body[0].color = snakeBodyColor;
    this.body.unshift(new Block(x, y, snakeHeadColor));
    this.#lastMove = this.direction;
  }

  move() {
    this.extend();
    this.body.pop();
  }

  #updateDirection(direction) {
    // prevent snake from going back
    if (direction >> 1 === this.#lastMove >> 1) return;
    this.direction = direction;
  }

  bindKeys() {
    document.addEventListener(
      'keydown',
      e => {
        switch (e.key) {
          case 'w':
          case 'ArrowUp':
            this.#updateDirection(kUp);
            break;
          case 's':
          case 'ArrowDown':
            this.#updateDirection(kDown);
            break;
          case 'a':
          case 'ArrowLeft':
            this.#updateDirection(kLeft);
            break;
          case 'd':
          case 'ArrowRight':
            this.#updateDirection(kRight);
            break;
        }
      },
      { signal: this.#controller.signal }
    );
  }

  unbindKeys() {
    this.#controller.abort();
    // the signal will abort listener even added again
    this.#controller = new AbortController();
  }
}

/* || Global Variables */
let snake;
let food;

// animation start time & previous frame time
let start, prevTime;
let gameStatus = 'end';

// scores
let score = 0;
let highestScore = 0;

/* || Functions */
function updateScores() {
  paraHighestScore.textContent = `历史记录：${highestScore}`;
  paraScore.textContent = `当前分数：${score}`;
}

// return true if block allready exists
function blockExist(x, y) {
  if (x === food.x && y === food.y) return true;
  for (const block of snake.body) {
    if (block.x === x && block.y === y) return true;
  }
  return false;
}

function updateFood() {
  let x, y;
  do {
    x = random(0, rows - 1);
    y = random(0, cols - 1);
  } while (blockExist(x, y));

  food.x = x;
  food.y = y;
}

function resetGame() {
  start = undefined;
  score = 0;
  snake = new Snake(10, 10, kRight);
  food = new Food(15, 15);
}

function drawFrame() {
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);

  snake.draw();
  food.draw();
}

function initGame() {
  resetGame();
  updateScores();
  drawFrame();
}

function loop(time) {
  if (gameStatus === 'end' || gameStatus === 'pause') {
    return;
  }
  if (start === undefined) {
    start = prevTime = time;
  }

  const ticks = Math.floor((time - prevTime) / 250);
  for (let i = 0; i < ticks; ++i) {
    if (snake.eatFood(food)) {
      ++score;
      highestScore = Math.max(score, highestScore);
      updateScores();
      updateFood();
      snake.extend();
    } else if (snake.checkMove()) {
      snake.move();
    } else {
      gameStatus = 'end';
      alert('Game Over');
      return;
    }

    drawFrame();
  }
  if (ticks >= 1) prevTime = time;

  requestAnimationFrame(loop);
}

function main() {
  const btnStart = document.getElementById('start');
  const btnPause = document.getElementById('pause');
  const btnResume = document.getElementById('resume');
  const btnRestart = document.getElementById('restart');
  const btnEnd = document.getElementById('end');
  const btnAuto = document.getElementById('auto');

  btnStart.addEventListener('click', () => {
    if (gameStatus !== 'end') return;
    resetGame();
    gameStatus = 'run';
    snake.bindKeys();
    requestAnimationFrame(loop);
  });

  btnPause.addEventListener('click', () => {
    if (gameStatus !== 'run') return;
    gameStatus = 'pause';
    start = undefined;
    snake.unbindKeys();
  });

  btnResume.addEventListener('click', () => {
    if (gameStatus !== 'pause') return;
    gameStatus = 'run';
    snake.bindKeys();
    requestAnimationFrame(loop);
  });

  btnRestart.addEventListener('click', () => {
    if (gameStatus !== 'run') return;
    initGame();
    snake.bindKeys();
  });

  btnEnd.addEventListener('click', () => {
    if (gameStatus === 'end') return;
    gameStatus = 'end';
    initGame();
  });

  initGame();
}

main();