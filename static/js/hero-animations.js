(function () {
  'use strict';

  /* ── Particles ────────────────────────────────────────────── */
  function initParticles() {
    if (window.innerWidth < 641) return;

    var hero = document.querySelector('.home-hero');
    if (!hero) return;

    var canvas = document.createElement('canvas');
    canvas.id = 'hero-particles';
    hero.insertBefore(canvas, hero.firstChild);

    var ctx = canvas.getContext('2d');
    var dots = [];
    var COUNT = 60;
    var running = true;

    function resize() {
      canvas.width = hero.offsetWidth;
      canvas.height = hero.offsetHeight;
    }

    function makeDot() {
      return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1 + 0.5,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3
      };
    }

    function init() {
      resize();
      dots = [];
      for (var i = 0; i < COUNT; i++) dots.push(makeDot());
    }

    function frame() {
      if (!running) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      for (var i = 0; i < dots.length; i++) {
        var d = dots[i];
        d.x += d.vx;
        d.y += d.vy;
        if (d.x < 0) d.x = canvas.width;
        if (d.x > canvas.width) d.x = 0;
        if (d.y < 0) d.y = canvas.height;
        if (d.y > canvas.height) d.y = 0;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fill();
      }
      requestAnimationFrame(frame);
    }

    document.addEventListener('visibilitychange', function () {
      running = !document.hidden;
      if (running) frame();
    });

    window.addEventListener('resize', resize);

    init();
    frame();
  }

  document.addEventListener('DOMContentLoaded', function () {
    initParticles();
  });
})();
