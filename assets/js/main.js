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

  // Лента [data-carousel]: кнопки назад/вперёд листают на ширину видимой части
  document.querySelectorAll('[data-carousel]').forEach(function (box) {
    var track = box.querySelector('[data-carousel-track]');
    var scope = box.closest('section') || document;
    var prev = scope.querySelector('[data-carousel-prev]'), next = scope.querySelector('[data-carousel-next]');
    if (!track) return;
    function step() { var it = track.querySelector('li'); return it ? Math.max(it.offsetWidth + 16, track.clientWidth - it.offsetWidth) : track.clientWidth * 0.8; }
    function upd() {
      if (prev) prev.disabled = track.scrollLeft < 4;
      if (next) next.disabled = track.scrollLeft + track.clientWidth > track.scrollWidth - 4;
    }
    if (prev) prev.addEventListener('click', function () { track.scrollBy({ left: -step(), behavior: 'smooth' }); });
    if (next) next.addEventListener('click', function () { track.scrollBy({ left: step(), behavior: 'smooth' }); });
    track.addEventListener('scroll', upd, { passive: true });
    window.addEventListener('resize', upd);
    upd();
  });

  // Просмотр фото крупно: ссылки <a data-lightbox="группа" href="большое фото">
  var groups = {};
  document.querySelectorAll('a[data-lightbox]').forEach(function (a) {
    var g = a.getAttribute('data-lightbox'); (groups[g] = groups[g] || []).push(a);
  });
  if (Object.keys(groups).length) {
    var ico = function (d) { return '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="' + d + '" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>'; };
    var lb = document.createElement('div');
    lb.className = 'lightbox'; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-label', 'Просмотр фото');
    lb.innerHTML = '<img class="lightbox__img" alt="">' +
      '<button class="lightbox__btn lightbox__close" type="button" aria-label="Закрыть">' + ico('M3.5 3.5l9 9M12.5 3.5l-9 9') + '</button>' +
      '<button class="lightbox__btn lightbox__prev" type="button" aria-label="Предыдущее фото">' + ico('M10 3 5 8l5 5') + '</button>' +
      '<button class="lightbox__btn lightbox__next" type="button" aria-label="Следующее фото">' + ico('M6 3l5 5-5 5') + '</button>' +
      '<div class="lightbox__count"></div>';
    document.body.appendChild(lb);
    var img = lb.querySelector('.lightbox__img'), cnt = lb.querySelector('.lightbox__count');
    var list = [], idx = 0, last = null;
    function show(i) {
      idx = (i + list.length) % list.length;
      var a = list[idx], th = a.querySelector('img');
      img.src = a.getAttribute('href'); img.alt = th ? th.alt : '';
      cnt.textContent = (idx + 1) + ' / ' + list.length;
      var nx = list[(idx + 1) % list.length]; if (nx) { var pre = new Image(); pre.src = nx.getAttribute('href'); }
    }
    function open(g, i) { list = groups[g]; last = document.activeElement; show(i); lb.classList.add('is-open'); document.body.classList.add('lightbox-open'); lb.querySelector('.lightbox__close').focus(); }
    function close() { lb.classList.remove('is-open'); document.body.classList.remove('lightbox-open'); if (last) last.focus(); }
    Object.keys(groups).forEach(function (g) {
      groups[g].forEach(function (a, i) { a.addEventListener('click', function (e) { e.preventDefault(); open(g, i); }); });
    });
    lb.querySelector('.lightbox__close').addEventListener('click', close);
    lb.querySelector('.lightbox__prev').addEventListener('click', function () { show(idx - 1); });
    lb.querySelector('.lightbox__next').addEventListener('click', function () { show(idx + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('is-open')) return;
      if (e.key === 'Escape') close(); else if (e.key === 'ArrowLeft') show(idx - 1); else if (e.key === 'ArrowRight') show(idx + 1);
    });
    var sx = null;
    lb.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', function (e) { if (sx === null) return; var dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 40) show(idx + (dx < 0 ? 1 : -1)); sx = null; });
  }

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
