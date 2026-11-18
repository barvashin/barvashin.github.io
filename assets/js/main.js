/* Общие скрипты сайта: шапка, мобильное меню, появление блоков, вкладки. */
(function () {
  var html = document.documentElement;
  html.classList.remove('no-js');
  if (location.search.indexOf('static') !== -1) html.classList.add('static');

  // Шапка: подложка при прокрутке
  var header = document.querySelector('.site-header');
  function onScroll() {
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 10);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Мобильное меню
  var menu = document.querySelector('.m-menu');
  document.addEventListener('click', function (e) {
    var open = e.target.closest('[data-menu-open]');
    var close = e.target.closest('[data-menu-close]');
    if (open && menu) { menu.classList.add('is-open'); document.body.classList.add('menu-open'); }
    if ((close || (e.target.closest('.m-menu a'))) && menu) { menu.classList.remove('is-open'); document.body.classList.remove('menu-open'); }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && menu) { menu.classList.remove('is-open'); document.body.classList.remove('menu-open'); }
  });

  // Появление блоков при прокрутке
  var items = document.querySelectorAll('[data-reveal]');
  if (html.classList.contains('static') || !('IntersectionObserver' in window)) {
    items.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    items.forEach(function (el, i) {
      var d = el.getAttribute('data-reveal');
      if (d) el.style.transitionDelay = d + 'ms';
      io.observe(el);
    });
  }

  // Вкладки: <div data-tabs> с кнопками [data-tab="id"] и панелями [data-panel="id"]
  document.querySelectorAll('[data-tabs]').forEach(function (box) {
    var btns = box.querySelectorAll('[data-tab]');
    var panels = box.querySelectorAll('[data-panel]');
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        var id = b.getAttribute('data-tab');
        btns.forEach(function (x) { x.classList.toggle('is-active', x === b); x.setAttribute('aria-selected', x === b); });
        panels.forEach(function (p) { p.hidden = p.getAttribute('data-panel') !== id; });
      });
    });
  });

  // FAQ: открыт только один вопрос в группе
  document.querySelectorAll('.faq').forEach(function (faq) {
    faq.querySelectorAll('details').forEach(function (d) {
      d.addEventListener('toggle', function () {
        if (d.open) faq.querySelectorAll('details').forEach(function (o) { if (o !== d) o.open = false; });
      });
    });
  });

  // Фоновые видео <video data-bg-video>: грузятся, когда блок близко к экрану,
  // играют без звука по кругу; паузу снаружи сразу снимаем, меню по правой кнопке отключено
  document.querySelectorAll('video[data-bg-video]').forEach(function (v) {
    var loaded = false, visible = false;
    v.muted = true; v.controls = false;
    function play() { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
    function load() {
      if (loaded) return; loaded = true;
      v.querySelectorAll('source[data-src]').forEach(function (s) { s.src = s.getAttribute('data-src'); });
      v.load();
    }
    v.addEventListener('pause', function () { if (visible && !document.hidden) play(); });
    v.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    if (v.parentElement) v.parentElement.addEventListener('contextmenu', function (e) { if (e.target === v.parentElement) e.preventDefault(); });
    if (!('IntersectionObserver' in window)) { visible = true; load(); play(); return; }
    new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        visible = en.isIntersecting;
        if (visible) { load(); play(); } else if (loaded) v.pause();
      });
    }, { rootMargin: '400px 0px' }).observe(v);
  });
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) document.querySelectorAll('video[data-bg-video]').forEach(function (v) { if (v.currentSrc) { var p = v.play(); if (p && p.catch) p.catch(function () {}); } });
  });

  // Формы «ник в Telegram»: открываем чат с Рахимом
  document.querySelectorAll('form[data-tg-form]').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var nick = (f.querySelector('input') || {}).value || '';
      var text = 'Здравствуйте! Мой ник в Telegram: ' + nick;
      window.open('https://t.me/rakhimbarvashin?text=' + encodeURIComponent(text), '_blank', 'noopener');
    });
  });
})();
