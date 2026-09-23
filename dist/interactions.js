(() => {
  const enabled = matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
  const particles = document.querySelector('.particles');
  let cleanup = () => {};

  function setup() {
    cleanup();
    if (!enabled.matches) return;

    const cursor = document.createElement('div');
    cursor.className = 'custom-cursor';
    cursor.setAttribute('aria-hidden', 'true');
    cursor.innerHTML = '<span class="cursor-ring"></span><span class="cursor-dot"></span>' + '<span class="cursor-trail"></span>'.repeat(8);
    document.body.append(cursor);
    const dot = cursor.querySelector('.cursor-dot');
    const ring = cursor.querySelector('.cursor-ring');
    const trail = [...cursor.querySelectorAll('.cursor-trail')];
    const points = trail.map(() => ({ x: 0, y: 0 }));
    let x = 0, y = 0, ringX = 0, ringY = 0, frame = 0, previous = 0;
    let visible = false, activeLink = null, parallaxX = 0, parallaxY = 0;
    const move = (el, px, py) => { el.style.transform = `translate3d(${px}px, ${py}px, 0)`; };

    function resetLink() {
      if (!activeLink) return;
      activeLink.style.removeProperty('--glow-x');
      activeLink.style.removeProperty('--glow-y');
      activeLink = null;
    }
    function tick(time) {
      frame = 0;
      if (!visible) return;
      const delta = Math.min((time - (previous || time - 16.7)) / 16.7, 3);
      previous = time;
      const smooth = 1 - Math.pow(.78, delta);
      ringX += (x - ringX) * smooth;
      ringY += (y - ringY) * smooth;
      move(dot, x, y);
      move(ring, ringX, ringY);
      let leadX = ringX, leadY = ringY;
      points.forEach((point, index) => {
        point.x += (leadX - point.x) * (1 - Math.pow(.6, delta));
        point.y += (leadY - point.y) * (1 - Math.pow(.6, delta));
        move(trail[index], point.x, point.y);
        leadX = point.x;
        leadY = point.y;
      });
      parallaxX += (((x / innerWidth) - .5) * 18 - parallaxX) * smooth;
      parallaxY += (((y / innerHeight) - .5) * 18 - parallaxY) * smooth;
      particles.style.transform = `translate3d(${parallaxX}px, ${parallaxY}px, 0)`;
      const unsettled = Math.abs(leadX - x) + Math.abs(leadY - y)
        + Math.abs(((x / innerWidth) - .5) * 18 - parallaxX)
        + Math.abs(((y / innerHeight) - .5) * 18 - parallaxY) > .15;
      if (unsettled) frame = requestAnimationFrame(tick);
      else previous = 0;
    }
    function onMove(event) {
      if (event.pointerType !== 'mouse') return;
      x = event.clientX;
      y = event.clientY;
      if (!visible) {
        ringX = x; ringY = y;
        points.forEach(point => { point.x = x; point.y = y; });
        move(dot, x, y); move(ring, x, y);
        trail.forEach(el => move(el, x, y));
        visible = true;
        document.documentElement.classList.add('cursor-active');
      }
      const link = event.target.closest('a, button');
      cursor.classList.toggle('is-hovering', !!link);
      if (activeLink !== link) { resetLink(); activeLink = link; }
      if (link) {
        const box = link.getBoundingClientRect();
        link.style.setProperty('--glow-x', `${x - box.left}px`);
        link.style.setProperty('--glow-y', `${y - box.top}px`);
      }
      if (!frame) frame = requestAnimationFrame(tick);
    }
    function hide() {
      visible = false;
      cancelAnimationFrame(frame); frame = 0; previous = 0;
      document.documentElement.classList.remove('cursor-active');
      cursor.classList.remove('is-pressed');
      resetLink();
    }
    const down = () => cursor.classList.add('is-pressed');
    const up = () => cursor.classList.remove('is-pressed');
    const visibility = () => { if (document.hidden) hide(); };
    const keyboard = event => { if (event.key === 'Tab') hide(); };
    const events = [
      [document, 'pointermove', onMove], [document.documentElement, 'pointerleave', hide],
      [window, 'blur', hide], [document, 'visibilitychange', visibility],
      [document, 'pointerdown', down], [window, 'pointerup', up],
      [document, 'keydown', keyboard], [window, 'scroll', hide]
    ];
    events.forEach(([target, type, handler]) => target.addEventListener(type, handler, { passive: true }));
    cleanup = () => {
      hide();
      events.forEach(([target, type, handler]) => target.removeEventListener(type, handler));
      particles.style.removeProperty('transform');
      cursor.remove();
    };
  }
  enabled.addEventListener('change', setup);
  setup();
})();
