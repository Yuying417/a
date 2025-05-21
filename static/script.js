console.log('script.js loaded');

window.addEventListener('load', () => {
  const canvas     = document.getElementById('gameCanvas');
  const ctx        = canvas.getContext('2d');
  const restartBtn = document.getElementById('restartBtn');

  // —— Read and initialize high score ——
  const storedHigh = localStorage.getItem('highScore');
  let highScore = storedHigh ? parseInt(storedHigh) : 0;

  // —— parameter ——
  let speed = 6;                   // Initial speed
  const gravity = 0.6;             // Gravity acceleration
  const groundY = canvas.height - 20;  // Ground height
  const maxJumps = 2;              // Maximum number of consecutive jumps
  let nextSpeedThreshold = 500;    // Every 500 points, the speed-up threshold
  const flySpawnRate = 200;        // Frequency of sky obstacle generation (number of frames)

  // —— Game Status ——
  let robot, obstacles, flyingObstacles,
      spawnCounter, flyCounter,
      spawnThreshold, score, gameOver, jumpCount;

  // Loading robot textures
  const robotImg = new Image();
  robotImg.src = '/static/images/robot.png';

  // —— Initialize/Reset Game ——
  function initGame() {
    speed = 6;
    robot = { x:50, y:groundY-48, width:48, height:48, vy:0 };
    obstacles = [];
    flyingObstacles = [];
    spawnCounter = 0;
    flyCounter = 0;
    spawnThreshold = Math.floor(30 + Math.random() * 20);
    score = 0;
    gameOver = false;
    jumpCount = 0;
    nextSpeedThreshold = 500;
    restartBtn.style.display = 'none';
  }

  // —— Jump processing ——
  function handleJump() {
    if (jumpCount < maxJumps) {
      // Fixed jump height around 60px
      const v0 = -Math.sqrt(2 * gravity * 60);
      robot.vy = v0;
      jumpCount++;
      playJumpSound(); // Jump sound effect
    }
  }

  // —— Input Binding ——
  document.addEventListener('keydown', e => {
    if (!gameOver && (e.code === 'Space' || e.code === 'ArrowUp')) {
      handleJump();
    }
  });
  canvas.addEventListener('click', () => {
    if (!gameOver) handleJump();
  });
  restartBtn.addEventListener('click', initGame);

  // —— Sound Effect ——
  function playJumpSound() {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
  }

  function playGameOverSound() {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
  }

  // —— Update Status ——
  function update() {
    robot.vy += gravity;
    robot.y += robot.vy;
    if (robot.y > groundY - robot.height) {
      robot.y = groundY - robot.height;
      robot.vy = 0;
      jumpCount = 0;
    }

    // Ground Obstacle Removal & Recovery
    obstacles.forEach(o => o.x -= speed);
    if (obstacles.length && obstacles[0].x + obstacles[0].width < 0) {
      obstacles.shift();
    }

    // Sky obstacle generation, movement, and recovery
    flyCounter++;
    if (flyCounter >= flySpawnRate) {
      flyCounter = 0;
      const flyY = 20 + Math.random() * 60;
      flyingObstacles.push({ x: canvas.width, y: flyY, width: 30, height: 30 });
    }
    flyingObstacles.forEach(f => f.x -= speed);
    if (flyingObstacles.length && flyingObstacles[0].x + flyingObstacles[0].width < 0) {
      flyingObstacles.shift();
    }

    // Ground obstacle generation
    spawnCounter++;
    if (spawnCounter >= spawnThreshold) {
      spawnCounter = 0;
      spawnThreshold = Math.floor(30 + Math.random() * 20);
      const h = 20 + Math.random() * 40;
      obstacles.push({ x: canvas.width, y: groundY - h, width: 20, height: h });
    }
  }

  // —— Collision Detection ——
  function collides(a, b) {
    const margin = 10;
    return (
      a.x + a.width - margin >= b.x &&
      a.x + margin <= b.x + b.width &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }

  // —— draw ——
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#444';
    ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY);

    // Drawing the robot
    if (robotImg.complete) {
      ctx.drawImage(robotImg, robot.x, robot.y, robot.width, robot.height);
    } else {
      ctx.fillStyle = 'teal';
      ctx.fillRect(robot.x, robot.y, robot.width, robot.height);
    }

    // Drawing ground obstacles
    ctx.fillStyle = 'firebrick';
    obstacles.forEach(o => ctx.fillRect(o.x, o.y, o.width, o.height));

    // Mapping aerial obstacles
    ctx.fillStyle = 'orange';
    flyingObstacles.forEach(f => {
      ctx.beginPath();
      ctx.arc(f.x + f.width / 2, f.y + f.height / 2, f.width / 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // Scores and high scores
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    ctx.fillText('High: ' + highScore, 10, 40);

    // Game Over Tips
    if (gameOver) {
      ctx.fillStyle = 'red';
      ctx.font = '32px sans-serif';
      ctx.fillText('Game Over', canvas.width / 2 - 80, canvas.height / 2);
      restartBtn.style.display = 'inline-block';
    }
  }

  // —— Main Loop ——
  function loop() {
    if (!gameOver) {
      update();
      // Ground obstacle collision
      for (let o of obstacles) {
        if (collides(robot, o)) {
          playGameOverSound();
          gameOver = true;
          break;
        }
      }
      // Mid-air obstacle collision
      if (!gameOver) {
        for (let f of flyingObstacles) {
          if (collides(robot, f)) {
            playGameOverSound();
            gameOver = true;
            break;
          }
        }
      }
      // Scoring and Speed ​​​​Up
      if (!gameOver) {
        score++;
        if (score >= nextSpeedThreshold) {
          speed *= 1.3;
          nextSpeedThreshold += 500;
        }
      }
    }
    draw();
    requestAnimationFrame(loop);
  }

  initGame();
  loop();
});