(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;

  // ---------- Year ----------
  $('#year').textContent = new Date().getFullYear();

  // ---------- Hide store buttons with no link ----------
  $$('a.store').forEach((a) => {
    if (!a.getAttribute('href')) a.remove();
  });
  $$('.p-links').forEach((el) => { if (!el.children.length) el.remove(); });

  // ---------- Theme ----------
  const root = document.documentElement;
  $('#themeToggle').addEventListener('click', () => {
    const next = root.dataset.theme === 'light' ? 'dark' : 'light';
    root.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch (e) {}
    window.dispatchEvent(new CustomEvent('themechange', { detail: next }));
  });

  // ---------- Nav: scrolled state, progress bar, mobile menu ----------
  const nav = $('#nav');
  const progress = $('#progress');
  const onScroll = () => {
    nav.classList.toggle('scrolled', window.scrollY > 10);
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  const menuBtn = $('#menuBtn');
  const navLinks = $('#navLinks');
  const setMenu = (open) => {
    navLinks.classList.toggle('open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
  };
  menuBtn.addEventListener('click', () => setMenu(!navLinks.classList.contains('open')));
  $$('a', navLinks).forEach((a) => a.addEventListener('click', () => setMenu(false)));

  // ---------- Active nav link ----------
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        $$('.nav-links a').forEach((a) => a.classList.remove('active'));
        $(`.nav-links a[href="#${e.target.id}"]`)?.classList.add('active');
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('section[id]').forEach((s) => spy.observe(s));

  // ---------- Reveal on scroll ----------
  const revealer = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        revealer.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  $$('.reveal, .reveal-3d').forEach((el, i) => {
    el.style.transitionDelay = `${(i % 4) * 80}ms`;
    revealer.observe(el);
  });
  // Fallback for fast jumps (anchor links, flings) where the observer can lag behind
  let revealQueued = false;
  const revealInView = () => {
    revealQueued = false;
    $$('.reveal:not(.in), .reveal-3d:not(.in)').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.95 && r.bottom > 0) {
        el.classList.add('in');
        revealer.unobserve(el);
      }
    });
  };
  window.addEventListener('scroll', () => {
    if (!revealQueued) { revealQueued = true; requestAnimationFrame(revealInView); }
  }, { passive: true });
  window.addEventListener('load', revealInView);
  // Once revealed, drop the delay so hover tilt feels instant
  $$('.reveal, .reveal-3d').forEach((el) =>
    el.addEventListener('transitionend', () => { el.style.transitionDelay = ''; }, { once: true })
  );

  // ---------- Typing effect ----------
  const typed = $('#typed');
  const words = ['Flutter apps.', 'Android & iOS apps.', 'offline-first apps.', 'clean architectures.', 'smooth UIs.'];
  if (!reduceMotion) {
    let w = 0, c = words[0].length, deleting = true;
    const tick = () => {
      const word = words[w];
      c += deleting ? -1 : 1;
      typed.textContent = word.slice(0, c);
      let delay = deleting ? 45 : 85;
      if (!deleting && c === word.length) { deleting = true; delay = 1800; }
      else if (deleting && c === 0) { deleting = false; w = (w + 1) % words.length; delay = 300; }
      setTimeout(tick, delay);
    };
    setTimeout(tick, 2200);
  }

  // ---------- Count-up stats ----------
  const counter = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const end = parseFloat(el.dataset.count);
      const dec = parseInt(el.dataset.decimals || '0', 10);
      const suffix = el.dataset.suffix || '';
      const dur = reduceMotion ? 0 : 1400;
      const start = performance.now();
      const step = (now) => {
        const t = dur ? Math.min((now - start) / dur, 1) : 1;
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = (end * eased).toFixed(dec) + suffix;
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
      counter.unobserve(el);
    });
  }, { threshold: 0.6 });
  $$('[data-count]').forEach((el) => counter.observe(el));

  if (!reduceMotion && finePointer) {
    // ---------- Cursor glow ----------
    const glow = $('#cursorGlow');
    window.addEventListener('pointermove', (e) => {
      glow.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
    }, { passive: true });

    // ---------- Hero phone follows cursor ----------
    const stage = $('#stage');
    window.addEventListener('pointermove', (e) => {
      if (window.innerWidth < 960 || window.scrollY > window.innerHeight) return;
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      stage.style.transform = `rotateY(${-18 + x * 16}deg) rotateX(${8 - y * 10}deg)`;
    }, { passive: true });

    // ---------- 3D tilt cards with glare ----------
    $$('.tilt').forEach((card) => {
      const max = card.classList.contains('project') ? 10 : 6;
      card.addEventListener('pointerenter', () => card.classList.add('tilting'));
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        card.style.transform = `rotateY(${(px - 0.5) * max * 2}deg) rotateX(${(0.5 - py) * max * 2}deg) translateZ(10px)`;
        card.style.setProperty('--mx', `${px * 100}%`);
        card.style.setProperty('--my', `${py * 100}%`);
        card.style.setProperty('--gx', `${px * 100}%`);
        card.style.setProperty('--gy', `${py * 100}%`);
      });
      card.addEventListener('pointerleave', () => {
        card.classList.remove('tilting');
        card.style.transform = '';
      });
    });

    // ---------- Magnetic buttons ----------
    $$('.magnetic').forEach((btn) => {
      btn.addEventListener('pointermove', (e) => {
        const r = btn.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        btn.style.transform = `translate(${x * 0.18}px, ${y * 0.3}px)`;
      });
      btn.addEventListener('pointerleave', () => { btn.style.transform = ''; });
    });
  }

  // ---------- 3D skill sphere ----------
  const sphere = $('#sphere');
  const tags = ['Flutter', 'Dart', 'Bloc', 'Cubit', 'GetX', 'Provider', 'Firebase', 'Firestore', 'REST APIs',
    'Sqflite', 'Hive', 'MongoDB', 'Node.js', 'Clean Arch', 'MVVM', 'MVC', 'Repository', 'DI', 'Git',
    'CI/CD', 'Shorebird', 'Razorpay', 'FCM', 'OSM', 'VLC', 'Android', 'iOS', 'Flutter Web', 'DevTools', 'Agile'];
  const hot = new Set(['Flutter', 'Dart', 'Bloc', 'GetX', 'Firebase', 'Shorebird']);
  const n = tags.length;
  const points = tags.map((t, i) => {
    // Fibonacci sphere distribution
    const phi = Math.acos(1 - (2 * (i + 0.5)) / n);
    const theta = Math.PI * (1 + Math.sqrt(5)) * i;
    const el = document.createElement('span');
    el.textContent = t;
    if (hot.has(t)) el.className = 'hot';
    sphere.appendChild(el);
    return { el, x: Math.sin(phi) * Math.cos(theta), y: Math.cos(phi), z: Math.sin(phi) * Math.sin(theta) };
  });
  let vx = 0.004, vy = 0.006, dragging = false, lastX = 0, lastY = 0;
  const rotate = (ax, ay) => {
    const cx = Math.cos(ax), sx = Math.sin(ax), cy = Math.cos(ay), sy = Math.sin(ay);
    points.forEach((p) => {
      const y1 = p.y * cx - p.z * sx;
      const z1 = p.y * sx + p.z * cx;
      const x2 = p.x * cy + z1 * sy;
      const z2 = -p.x * sy + z1 * cy;
      p.x = x2; p.y = y1; p.z = z2;
    });
  };
  const renderSphere = () => {
    const R = sphere.clientWidth / 2 - 30;
    points.forEach((p) => {
      const scale = (p.z + 2) / 3;
      p.el.style.transform = `translate(-50%, -50%) translate3d(${p.x * R}px, ${p.y * R}px, 0) scale(${scale})`;
      p.el.style.opacity = (0.25 + 0.75 * (p.z + 1) / 2).toFixed(2);
      p.el.style.zIndex = String(Math.round((p.z + 1) * 100));
    });
  };
  sphere.addEventListener('pointerdown', (e) => {
    dragging = true; lastX = e.clientX; lastY = e.clientY;
    sphere.setPointerCapture(e.pointerId);
  });
  sphere.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    vy = (e.clientX - lastX) * 0.004;
    vx = -(e.clientY - lastY) * 0.004;
    lastX = e.clientX; lastY = e.clientY;
  });
  const endDrag = () => { dragging = false; };
  sphere.addEventListener('pointerup', endDrag);
  sphere.addEventListener('pointercancel', endDrag);

  let sphereVisible = false;
  new IntersectionObserver(([e]) => { sphereVisible = e.isIntersecting; }).observe(sphere);
  const loop = () => {
    if (sphereVisible) {
      rotate(vx, vy);
      renderSphere();
      if (!dragging) {
        // ease back toward a gentle idle spin
        vx += (0.003 - vx) * 0.02;
        vy += (0.005 - vy) * 0.02;
      }
    }
    requestAnimationFrame(loop);
  };
  renderSphere();
  if (!reduceMotion) requestAnimationFrame(loop);

  // ---------- Copy email ----------
  const toast = $('#toast');
  let toastTimer;
  const showToast = (msg) => {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
  };
  $('#copyEmail').addEventListener('click', async (e) => {
    const email = e.currentTarget.dataset.email;
    try {
      await navigator.clipboard.writeText(email);
      showToast('✓ Email copied to clipboard');
    } catch {
      showToast(email);
    }
  });
})();
