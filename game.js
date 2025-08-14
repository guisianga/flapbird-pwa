(function(){
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');

  // Responsive scale to fit screen while keeping aspect
  function fit() {
    const scale = Math.min(window.innerWidth / canvas.width, window.innerHeight / canvas.height);
    canvas.style.transform = `scale(${scale})`;
  }
  window.addEventListener('resize', fit);
  fit();

  const G = 0.45, FLAP = -8.5;
  let bird = { x: 140, y: 480, r: 22, v: 0 };
  let pipes = [];
  let gap = 220, pipeW = 86, speed = 3.4;
  let groundY = canvas.height - 90;
  let score = 0, best = parseInt(localStorage.getItem('fb_best')||'0',10);
  let over = false, started = false;

  function reset() {
    bird = { x: 140, y: 480, r: 22, v: 0 };
    pipes = [];
    score = 0;
    over = false; started = false;
    let x = canvas.width + 80;
    for (let i=0;i<4;i++) {
      pipes.push(makePipe(x));
      x += 220;
    }
  }
  function makePipe(startX) {
    const topH = 60 + Math.random() * (canvas.height - gap - 200);
    return { x: startX, top: topH, passed:false };
  }

  function circleRectCollide(cx, cy, r, rx, ry, rw, rh) {
    const closestX = Math.max(rx, Math.min(cx, rx + rw));
    const closestY = Math.max(ry, Math.min(cy, ry + rh));
    const dx = cx - closestX, dy = cy - closestY;
    return (dx*dx + dy*dy) <= r*r;
  }

  function tick() {
    requestAnimationFrame(tick);

    // physics
    if (!over && started) {
      bird.v += G;
      bird.y += bird.v;
      for (let p of pipes) {
        p.x -= speed;
        if (!p.passed && (p.x + pipeW) < bird.x) {
          p.passed = true;
          score++;
        }
      }
      // recycle
      if (pipes[0].x + pipeW < -10) {
        pipes.shift();
        pipes.push(makePipe(pipes[pipes.length-1].x + 220));
      }
      // collide ground
      if (bird.y + bird.r > groundY) { bird.y = groundY - bird.r; gameOver(); }
      // collide pipes
      for (let p of pipes) {
        if (circleRectCollide(bird.x, bird.y, bird.r, p.x, 0, pipeW, p.top) ||
            circleRectCollide(bird.x, bird.y, bird.r, p.x, p.top + gap, pipeW, groundY - (p.top + gap))) {
          gameOver(); break;
        }
      }
    }

    // draw
    ctx.clearRect(0,0,canvas.width, canvas.height);
    // sky
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0,0,canvas.width, canvas.height);
    // ground
    ctx.fillStyle = '#DEB887';
    ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY);

    // pipes
    ctx.fillStyle = '#228B22';
    for (let p of pipes) {
      ctx.fillRect(p.x, 0, pipeW, p.top);
      ctx.fillRect(p.x, p.top + gap, pipeW, groundY - (p.top + gap));
    }

    // bird
    ctx.beginPath();
    ctx.arc(bird.x, bird.y, bird.r, 0, Math.PI*2);
    ctx.fillStyle = '#FFD400';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#000';
    ctx.stroke();
    // eye
    ctx.beginPath();
    ctx.arc(bird.x + 8, bird.y - 6, 4, 0, Math.PI*2);
    ctx.fillStyle = '#000';
    ctx.fill();

    // score HUD
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(12, 12, 160, 56);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 24px system-ui, Roboto, sans-serif';
    ctx.fillText('Placar: ' + score, 20, 46);

    if (!started) {
      ctx.font = 'bold 36px system-ui, Roboto, sans-serif';
      ctx.fillText('Toque para voar', canvas.width/2 - 150, canvas.height/2 - 20);
    }

    if (over) {
      ctx.font = 'bold 42px system-ui, Roboto, sans-serif';
      ctx.fillStyle = '#fff';
      ctx.fillText('FIM DE JOGO', canvas.width/2 - 140, canvas.height/2 - 20);
      ctx.font = 'bold 28px system-ui, Roboto, sans-serif';
      ctx.fillText(`Placar: ${score}  |  Recorde: ${best}`, canvas.width/2 - 160, canvas.height/2 + 24);
      ctx.fillText('Toque para reiniciar', canvas.width/2 - 160, canvas.height/2 + 64);
    }
  }

  function flap() {
    if (over) {
      reset();
      return;
    }
    started = true;
    bird.v = FLAP;
  }

  function gameOver() {
    over = true;
    if (score > best) { best = score; localStorage.setItem('fb_best', String(best)); }
  }

  canvas.addEventListener('pointerdown', flap);
  window.addEventListener('keydown', (e)=>{ if (e.code === 'Space') flap(); });

  reset();
  tick();
})();