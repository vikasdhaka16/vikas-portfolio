(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
    const isLight = root.dataset.theme === 'light';
    const next = isLight ? 'dark' : 'light';
    root.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch (e) {}
  });

  // ---------- Nav: scrolled state + mobile menu ----------
  const nav = $('#nav');
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 10);
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
  const sections = $$('section[id]');
  const linkFor = (id) => $(`.nav-links a[href="#${id}"]`);
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        $$('.nav-links a').forEach((a) => a.classList.remove('active'));
        linkFor(e.target.id)?.classList.add('active');
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach((s) => spy.observe(s));

  // ---------- Reveal on scroll ----------
  const revealer = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        revealer.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  $$('.reveal').forEach((el, i) => {
    el.style.transitionDelay = `${(i % 4) * 70}ms`;
    revealer.observe(el);
  });

  // ---------- Typing effect ----------
  const typed = $('#typed');
  const words = ['Flutter apps.', 'Android & iOS apps.', 'offline-first apps.', 'clean architectures.', 'smooth UIs.'];
  if (!reduceMotion) {
    let w = 0, c = words[0].length, deleting = true;
    typed.textContent = words[0];
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
  } else {
    typed.textContent = words[0];
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

  // ---------- Phone tilt follows cursor ----------
  const phone = $('#phone');
  if (phone && !reduceMotion && window.matchMedia('(pointer: fine)').matches) {
    window.addEventListener('mousemove', (e) => {
      if (window.innerWidth < 960) return;
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      phone.style.transform = `rotateY(${-12 + x * 8}deg) rotateX(${6 - y * 6}deg)`;
    });
  }

  // ---------- Project card spotlight ----------
  $$('.project').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - r.left}px`);
      card.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });

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
