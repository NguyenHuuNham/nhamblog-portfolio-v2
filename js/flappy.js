// js/flappy.js
const canvas = document.getElementById('flappyCanvas');
const ctx = canvas.getContext('2d');

const SCORE_DISPLAY = document.getElementById('score-display');
const OVERLAY_UI = document.getElementById('overlay-ui');
const OVERLAY_TITLE = document.getElementById('overlay-title');
const OVERLAY_DESC = document.getElementById('overlay-desc');
const START_BTN = document.getElementById('start-btn');
const RESTART_BTN = document.getElementById('restart-btn');
const BEST_SCORE = document.getElementById('best-score');

// Physics & Dimensions
const GRAVITY = 0.35;
const JUMP = -6.5;
const PIPE_SPEED = 2.5;
const PIPE_WIDTH = 55;
const PIPE_GAP = 160;

let frames = 0;
let score = 0;
let bestScore = parseInt(localStorage.getItem('flappyBest')) || 0;
let currentState = 'START'; // START, PLAYING, GAME_OVER
let animationReq;

const bird = {
  x: 60, y: 320, radius: 18,
  velocity: 0,
  draw: function() {
    ctx.font = '36px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.save();
    ctx.translate(this.x, this.y);
    // Tính toán góc nghiêng khi rơi
    let rotation = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, (this.velocity * 0.1)));
    ctx.rotate(rotation);
    ctx.fillText('🐤', 0, 0);
    ctx.restore();
  },
  update: function() {
    this.velocity += GRAVITY;
    this.y += this.velocity;
    // Chạm đất hoặc bay quá nóc
    if(this.y + this.radius >= canvas.height || this.y - this.radius <= 0) {
      currentState = 'GAME_OVER';
    }
  },
  jump: function() { 
    this.velocity = JUMP; 
  },
  reset: function() {
    this.y = 320;
    this.velocity = 0;
  }
};

const pipes = {
  items: [],
  draw: function() {
    ctx.fillStyle = '#73bf2e';
    ctx.strokeStyle = '#558c22';
    ctx.lineWidth = 3;
    
    this.items.forEach(p => {
      // Ống trên
      ctx.fillRect(p.x, 0, PIPE_WIDTH, p.top);
      ctx.strokeRect(p.x, 0, PIPE_WIDTH, p.top);
      // Viền nắp ống trên
      ctx.fillRect(p.x - 3, p.top - 20, PIPE_WIDTH + 6, 20);
      ctx.strokeRect(p.x - 3, p.top - 20, PIPE_WIDTH + 6, 20);

      // Ống dưới
      ctx.fillRect(p.x, canvas.height - p.bottom, PIPE_WIDTH, p.bottom);
      ctx.strokeRect(p.x, canvas.height - p.bottom, PIPE_WIDTH, p.bottom);
      // Viền nắp ống dưới
      ctx.fillRect(p.x - 3, canvas.height - p.bottom, PIPE_WIDTH + 6, 20);
      ctx.strokeRect(p.x - 3, canvas.height - p.bottom, PIPE_WIDTH + 6, 20);
    });
  },
  update: function() {
    if(frames % 110 === 0) {
      let minH = 50;
      let maxH = canvas.height - PIPE_GAP - minH;
      let topH = Math.random() * (maxH - minH + 1) + minH;
      let bottomH = canvas.height - (topH + PIPE_GAP);
      this.items.push({ x: canvas.width, top: topH, bottom: bottomH, passed: false });
    }
    
    for(let i = 0; i < this.items.length; i++) {
        let p = this.items[i];
        p.x -= PIPE_SPEED;

        // Va chạm AABB (Thu gọn bán kính hitbox để đỡ chết oan)
        let cx = bird.x;
        let cy = bird.y;
        let r = bird.radius - 4; 

        if (cx + r > p.x && cx - r < p.x + PIPE_WIDTH) {
            if (cy - r < p.top || cy + r > canvas.height - p.bottom) {
                currentState = 'GAME_OVER';
            }
        }

        // Tính điểm
        if(p.x + PIPE_WIDTH < bird.x && !p.passed) {
            score++;
            SCORE_DISPLAY.textContent = score;
            p.passed = true;
        }

        if(p.x + PIPE_WIDTH < 0) {
            this.items.shift();
            i--;
        }
    }
  },
  reset: function() { this.items = []; }
};

// Cấu trúc nền/Sàn đơn giản
function drawBackground() {
  // Trời
  ctx.fillStyle = '#70c5ce';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // Đám mây đơn giản
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.beginPath();
  ctx.arc(100, 100, 30, 0, Math.PI*2);
  ctx.arc(140, 100, 40, 0, Math.PI*2);
  ctx.arc(180, 100, 30, 0, Math.PI*2);
  ctx.fill();
  
  ctx.beginPath();
  ctx.arc(300, 250, 20, 0, Math.PI*2);
  ctx.arc(330, 250, 30, 0, Math.PI*2);
  ctx.arc(360, 250, 20, 0, Math.PI*2);
  ctx.fill();
}

function loop() {
  if (currentState === 'PLAYING') {
    drawBackground();
    pipes.draw();
    pipes.update();
    bird.draw();
    bird.update();
    frames++;
    animationReq = requestAnimationFrame(loop);
  } else if (currentState === 'GAME_OVER') {
    handleGameOver();
  } else {
    // START
    drawBackground();
    bird.draw();
    animationReq = requestAnimationFrame(loop);
  }
}

function handleGameOver() {
  if (score > bestScore) {
    bestScore = score;
    localStorage.setItem('flappyBest', bestScore.toString());
  }
  OVERLAY_UI.classList.remove('hidden');
  OVERLAY_TITLE.textContent = 'THUA CẢ RỒI 🥲';
  OVERLAY_TITLE.style.color = '#ef4444';
  OVERLAY_DESC.innerHTML = `Bạn bay được <strong style="color:#fbbf24">${score}</strong> ống khói!`;
  
  BEST_SCORE.textContent = 'Kỷ lục hiện tại: ' + bestScore;
  BEST_SCORE.classList.remove('hidden');
  
  START_BTN.classList.add('hidden');
  RESTART_BTN.classList.remove('hidden');
}

function jump() {
  if (currentState === 'START') {
    currentState = 'PLAYING';
    OVERLAY_UI.classList.add('hidden');
  }
  if (currentState === 'PLAYING') {
    bird.jump();
  }
}

function resetGame() {
  frames = 0;
  score = 0;
  SCORE_DISPLAY.textContent = score;
  bird.reset();
  pipes.reset();
  currentState = 'START';
  
  OVERLAY_UI.classList.remove('hidden');
  OVERLAY_TITLE.textContent = 'FLAPPY🍉';
  OVERLAY_TITLE.style.color = '#fff';
  OVERLAY_DESC.innerHTML = 'Dùng chuột click hoặc nhấn phím <kbd style="background:#333;padding:2px 8px;border-radius:4px">SPACE</kbd>';
  BEST_SCORE.classList.add('hidden');
  START_BTN.classList.remove('hidden');
  RESTART_BTN.classList.add('hidden');
}

// Events
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    e.preventDefault();
    if(currentState === 'GAME_OVER') {
      resetGame();
      jump(); // Auto start immediately if press space again
      loop();
    } else {
      jump();
    }
  }
});

canvas.addEventListener('mousedown', () => {
    if(currentState === 'GAME_OVER') {
        // Must click restart btn
    } else {
        jump();
    }
});

START_BTN.addEventListener('click', () => {
  jump();
});
RESTART_BTN.addEventListener('click', () => {
  resetGame();
  jump();
  loop();
});

// Kickoff
if(bestScore > 0) {
    BEST_SCORE.textContent = 'Kỷ lục hiện tại: ' + bestScore;
    BEST_SCORE.classList.remove('hidden');
}
loop();
