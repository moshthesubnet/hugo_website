(function () {
  'use strict';

  /* ── Typewriter ───────────────────────────────────────────── */
  function initTypewriter(reducedMotion) {
    var el = document.getElementById('hero-typewriter');
    if (!el) return;

    var phrases = [
      'Panic! At The Patch Panel',
      'Homelab Wrecker',
      'Default Gateway Dreams',
      'Kenough'
    ];
    var phraseIdx = 0;
    var charIdx = 0;
    var deleting = false;

    function tick() {
      var current = phrases[phraseIdx];
      if (!deleting) {
        charIdx++;
        el.textContent = current.slice(0, charIdx);
        if (charIdx === current.length) {
          deleting = true;
          setTimeout(tick, 2000);
          return;
        }
        setTimeout(tick, 80);
      } else {
        charIdx--;
        el.textContent = current.slice(0, charIdx);
        if (charIdx === 0) {
          deleting = false;
          phraseIdx = (phraseIdx + 1) % phrases.length;
          setTimeout(tick, 400);
          return;
        }
        setTimeout(tick, 40);
      }
    }

    if (reducedMotion) {
      el.textContent = phrases[0];
      return;
    }
    setTimeout(tick, 800);
  }

  document.addEventListener('DOMContentLoaded', function () {
    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    initTypewriter(reducedMotion);
  });
})();
