// ============================================================
// script.js — animaciones e interacción
// No hace falta tocar nada acá salvo que quieras cambiar comportamiento.
// ============================================================

// // NAV: se compacta al scrollear
const nav = document.querySelector('.nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('is-scrolled', window.scrollY > 20);
}, { passive: true });

// // NAV MOBILE: abre/cierra hamburguesa
document.querySelector('.nav__burger').addEventListener('click', () => nav.classList.toggle('is-open'));
document.querySelectorAll('.nav__links a').forEach(a => a.addEventListener('click', () => nav.classList.remove('is-open')));

// // REVEAL: cualquier .reveal aparece cuando entra en pantalla
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('is-visible');
      revealObserver.unobserve(e.target);   // // borrá esta línea si querés que se repita cada vez
    }
  });
}, { threshold: 0.15 });
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// // CONTADORES: anima .stat__num hasta data-count
const countObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target;
    const end = +el.dataset.count;
    const suffix = el.dataset.suffix || '';
    const duration = 1600;                  // // ms que tarda en contar
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3); // ease-out
      el.textContent = Math.round(end * eased) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    countObserver.unobserve(el);
  });
}, { threshold: 0.5 });
document.querySelectorAll('.stat__num').forEach(el => countObserver.observe(el));

// // PARALLAX SUAVE en la imagen del hero (sigue el mouse). Borrá este bloque si no lo querés.
const heroImg = document.querySelector('.hero__media');
if (heroImg && matchMedia('(pointer:fine)').matches) {
  document.querySelector('.hero').addEventListener('mousemove', (ev) => {
    const x = (ev.clientX / innerWidth - .5) * 12;   // // 12 = intensidad
    const y = (ev.clientY / innerHeight - .5) * 12;
    heroImg.style.transform = `rotateY(${x}deg) rotateX(${-y}deg)`;
  });
  document.querySelector('.hero').addEventListener('mouseleave', () => heroImg.style.transform = '');
}
