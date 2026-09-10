// ============================================================
// script.js — animaciones e interacción
// ============================================================

// // NAV: se compacta al scrollear
const nav = document.querySelector('.nav');
addEventListener('scroll', () => nav.classList.toggle('is-scrolled', scrollY > 20), { passive: true });

// // NAV MOBILE
document.querySelector('.nav__burger').addEventListener('click', () => nav.classList.toggle('is-open'));
document.querySelectorAll('.nav__links a').forEach(a => a.addEventListener('click', () => nav.classList.remove('is-open')));

// // NAV: marca el link de la sección visible
const navLinks = [...document.querySelectorAll('.nav__links a')];
const sections = navLinks.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
const activeObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    navLinks.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === '#' + e.target.id));
  });
}, { rootMargin: '-40% 0px -55% 0px' });
sections.forEach(s => activeObserver.observe(s));

// // REVEAL: cualquier .reveal aparece al entrar en pantalla
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('is-visible'); revealObserver.unobserve(e.target); }
  });
}, { threshold: 0.15 });
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// // DONUT ANIMADO
// Lee los gajos de las etiquetas .donut__lbl (data-seg, data-value). Al aparecer, los gajos
// "crecen" en secuencia, las etiquetas se ubican solas alrededor y el centro va contando.
// Después rota automáticamente el gajo destacado; con el mouse (gajo, etiqueta o leyenda) se fija.
const donut = document.querySelector('.donut');
if (donut) {
  const NS = 'http://www.w3.org/2000/svg';
  const CX = 160, CY = 160, R_OUT = 110, R_IN = 68, GAP = 1.5;   // // geometría (grados de separación en GAP)
  const svgSegs = donut.querySelector('.donut__segs');
  const pct = donut.querySelector('.donut__pct');
  const labels = [...donut.querySelectorAll('.donut__lbl')];
  const legend = [...document.querySelectorAll('.legend li[data-seg]')];

  const data = labels.map(l => ({ id: l.dataset.seg, value: +l.dataset.value, label: l, text: l.childNodes[0].textContent.trim() }));
  const total = data.reduce((s, d) => s + d.value, 0);

  const pt = (r, deg) => { const a = (deg - 90) * Math.PI / 180; return [CX + r * Math.cos(a), CY + r * Math.sin(a)]; };
  const arcPath = (a0, a1) => {
    if (a1 - a0 <= 0) return '';
    const large = a1 - a0 > 180 ? 1 : 0;
    const [x0, y0] = pt(R_OUT, a0), [x1, y1] = pt(R_OUT, a1), [x2, y2] = pt(R_IN, a1), [x3, y3] = pt(R_IN, a0);
    return `M${x0},${y0} A${R_OUT},${R_OUT} 0 ${large} 1 ${x1},${y1} L${x2},${y2} A${R_IN},${R_IN} 0 ${large} 0 ${x3},${y3} Z`;
  };

  // crear gajos + posicionar etiquetas
  let start = 0;
  data.forEach(d => {
    d.a0 = start + GAP / 2; d.a1 = start + (d.value / total) * 360 - GAP / 2; start += (d.value / total) * 360;
    d.mid = (d.a0 + d.a1) / 2;
    d.el = document.createElementNS(NS, 'path');
    d.el.setAttribute('class', 'donut__seg'); d.el.dataset.seg = d.id;
    const [dx, dy] = pt(10, d.mid);
    d.el.style.setProperty('--dx', (dx - CX) + 'px'); d.el.style.setProperty('--dy', (dy - CY) + 'px');
    svgSegs.appendChild(d.el);
  });

  // etiquetas afuera del anillo, alineadas según el lado (se recalcula al cambiar el tamaño)
  const svg = donut.querySelector('svg');
  const placeLabels = () => {
    const sr = svg.getBoundingClientRect(), br = donut.getBoundingClientRect(), k = sr.width / 320;
    data.forEach(d => {
      const [lx, ly] = pt(R_OUT + 18, d.mid);
      const x = sr.left - br.left + lx * k, y = sr.top - br.top + ly * k, right = lx >= CX;
      d.label.style.left = right ? `${x}px` : 'auto';
      d.label.style.right = right ? 'auto' : `${br.width - x}px`;
      d.label.style.top = `${y}px`;
      d.label.style.textAlign = right ? 'left' : 'right';
    });
  };
  placeLabels();
  addEventListener('resize', placeLabels);

  // resaltar un gajo
  let active = null, timer = null;
  const setActive = (id) => {
    active = id;
    donut.classList.toggle('has-active', !!id);
    data.forEach(d => { d.el.classList.toggle('is-active', d.id === id); d.label.classList.toggle('is-active', d.id === id); });
    legend.forEach(li => li.classList.toggle('is-active', li.dataset.seg === id));
    const d = data.find(x => x.id === id);
    if (d) countTo(d.value);
  };
  let countRaf;
  const countTo = (target) => {
    cancelAnimationFrame(countRaf);
    const from = parseInt(pct.textContent) || 0, t0 = performance.now(), dur = 700;
    const step = (now) => {
      const p = Math.min((now - t0) / dur, 1), e = 1 - Math.pow(1 - p, 3);
      pct.textContent = Math.round(from + (target - from) * e) + '%';
      if (p < 1) countRaf = requestAnimationFrame(step);
    };
    countRaf = requestAnimationFrame(step);
  };
  // estado neutro: ningún gajo destacado, centro vacío
  const clearActive = () => {
    active = null;
    donut.classList.remove('has-active');
    data.forEach(d => { d.el.classList.remove('is-active'); d.label.classList.remove('is-active'); });
    legend.forEach(li => li.classList.remove('is-active'));
    pct.textContent = '';
  };
  // rotación automática: A → B → C → neutro → … (cada 2.8s). Con el mouse encima se frena;
  // al salir vuelve al gráfico normal y la rotación retoma después de una pausa.
  let idx = -1, resumeTimer = null;
  const autoNext = () => { idx = (idx + 1) % (data.length + 1); idx < data.length ? setActive(data[idx].id) : clearActive(); };
  const startAuto = () => { clearInterval(timer); timer = setInterval(autoNext, 2800); };
  // hoverOut se demora un poco: si el gajo se desplaza y el mouse lo "pierde" un instante, no parpadea
  let outTimer = null;
  const hoverIn = (id) => { clearTimeout(outTimer); clearInterval(timer); clearTimeout(resumeTimer); if (active !== id) setActive(id); };
  const hoverOut = () => {
    clearTimeout(outTimer);
    outTimer = setTimeout(() => { clearActive(); idx = -1; resumeTimer = setTimeout(startAuto, 4000); }, 160);
  };
  data.forEach(d => {
    [d.el, d.label].forEach(el => { el.addEventListener('mouseenter', () => hoverIn(d.id)); el.addEventListener('mouseleave', hoverOut); });
  });
  legend.forEach(li => { li.addEventListener('mouseenter', () => hoverIn(li.dataset.seg)); li.addEventListener('mouseleave', hoverOut); });

  // animación de entrada: los gajos crecen uno tras otro
  new IntersectionObserver((entries, obs) => {
    if (!entries[0].isIntersecting) return;
    obs.disconnect();
    placeLabels();
    const t0 = performance.now(), per = 650, overlap = 0.45;   // // duración por gajo y solapamiento
    const draw = (now) => {
      let done = true;
      data.forEach((d, i) => {
        const s = i * per * (1 - overlap), p = Math.min(Math.max((now - t0 - s) / per, 0), 1);
        const e = 1 - Math.pow(1 - p, 3);
        d.el.setAttribute('d', arcPath(d.a0, d.a0 + (d.a1 - d.a0) * e));
        if (p < 1) done = false;
      });
      if (!done) requestAnimationFrame(draw);
      else { donut.classList.add('is-on'); autoNext(); startAuto(); }
    };
    requestAnimationFrame(draw);
  }, { threshold: 0.4 }).observe(donut);
}

// // RELOJ: marcas + aguja que barre hasta data-minutes, arco que se dibuja y número que cuenta
const clock = document.querySelector('.clock');
if (clock) {
  const minutes = +clock.dataset.minutes || 0;
  const ticks = clock.querySelector('.clock__ticks');
  for (let i = 0; i < 60; i++) {                       // 60 marcas, las de 5 en 5 más grandes
    const a = (i / 60) * Math.PI * 2, major = i % 5 === 0;
    const r1 = major ? 78 : 84, r2 = 88;
    const l = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    l.setAttribute('x1', 100 + Math.sin(a) * r1); l.setAttribute('y1', 100 - Math.cos(a) * r1);
    l.setAttribute('x2', 100 + Math.sin(a) * r2); l.setAttribute('y2', 100 - Math.cos(a) * r2);
    if (major) l.classList.add('is-major');
    ticks.appendChild(l);
  }
  new IntersectionObserver((entries, obs) => {
    if (!entries[0].isIntersecting) return;
    const C = 2 * Math.PI * 92, frac = minutes / 60;
    clock.style.setProperty('--deg', (frac * 360) + 'deg');
    clock.querySelector('.clock__arc').style.strokeDasharray = `${frac * C} ${C}`;
    const num = clock.querySelector('.clock__num'), start = performance.now(), dur = 2200;
    const tick = (now) => {
      const p = Math.min((now - start) / dur, 1), eased = 1 - Math.pow(1 - p, 3);
      num.textContent = Math.round(minutes * eased);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    obs.disconnect();
  }, { threshold: 0.5 }).observe(clock);
}

// // PARALLAX SUAVE en el hero (sigue el mouse)
const heroMedia = document.querySelector('.hero__media');
if (heroMedia && matchMedia('(pointer:fine)').matches) {
  const hero = document.querySelector('.hero');
  hero.addEventListener('mousemove', (ev) => {
    const x = (ev.clientX / innerWidth - .5) * 12, y = (ev.clientY / innerHeight - .5) * 12;
    heroMedia.style.transform = `rotateY(${x}deg) rotateX(${-y}deg)`;
  });
  hero.addEventListener('mouseleave', () => heroMedia.style.transform = '');
}
