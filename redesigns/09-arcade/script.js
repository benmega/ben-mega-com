/* Ben Mega - behaviour: theme toggle, HUD section marker, reveals, dialogs and
   the screenshot lightbox. Loaded in <head> so a saved theme applies before
   first paint; everything else waits for the DOM. Setup runs once, and a
   back/forward cache restore only clears pending reveals. */
(function () {
  'use strict';

  var root = document.documentElement;
  var THEME_KEY = 'theme';
  var THEME_COLOURS = { dark: '#0b0c16', light: '#e7e3d6' };
  var lightQuery = window.matchMedia('(prefers-color-scheme: light)');
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  root.classList.add('js');

  // ---------------------------------------------------------------- Theme --

  function storedTheme() {
    try {
      var value = localStorage.getItem(THEME_KEY);
      return value === 'light' || value === 'dark' ? value : null;
    } catch (err) {
      return null;
    }
  }

  function applyTheme(theme) {
    root.dataset.theme = theme;
    var metas = document.querySelectorAll('meta[name="theme-color"]');
    for (var i = 0; i < metas.length; i++) metas[i].setAttribute('content', THEME_COLOURS[theme]);
    var toggle = document.querySelector('[data-theme-toggle]');
    if (toggle) toggle.setAttribute('aria-label', 'Switch to ' + (theme === 'light' ? 'dark' : 'light') + ' theme');
  }

  applyTheme(storedTheme() || (lightQuery.matches ? 'light' : 'dark'));

  function setupTheme() {
    var toggle = document.querySelector('[data-theme-toggle]');
    if (!toggle) return;
    applyTheme(root.dataset.theme);
    toggle.addEventListener('click', function () {
      var next = root.dataset.theme === 'light' ? 'dark' : 'light';
      applyTheme(next);
      try {
        localStorage.setItem(THEME_KEY, next);
      } catch (err) {
        // Storage blocked: the choice lasts for this page view only.
      }
    });
    lightQuery.addEventListener('change', function (event) {
      if (!storedTheme()) applyTheme(event.matches ? 'light' : 'dark');
    });
  }

  // ------------------------------------------------- HUD section marker --

  function setupSectionMarker() {
    var links = document.querySelectorAll('.hud-nav a[href^="#"]');
    if (!links.length || !('IntersectionObserver' in window)) return;
    var bySection = new Map();
    for (var i = 0; i < links.length; i++) {
      var section = document.getElementById(links[i].getAttribute('href').slice(1));
      if (section) bySection.set(section, links[i]);
    }
    // A section counts as current while it crosses the middle of the screen.
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var link = bySection.get(entry.target);
        if (entry.isIntersecting) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      });
    }, { rootMargin: '-50% 0px -50% 0px' });
    bySection.forEach(function (link, section) { observer.observe(section); });
  }

  // --------------------------------------------------------------- Reveal --

  var REVEAL_ITEMS = '.section-head, .row-label, .stage, .bag, .contact-list li';

  function revealAll() {
    var pending = document.querySelectorAll('.is-pending');
    for (var i = 0; i < pending.length; i++) pending[i].classList.remove('is-pending');
  }

  function setupReveal() {
    if (reducedMotion.matches || !('IntersectionObserver' in window)) return;
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.remove('is-pending');
        observer.unobserve(entry.target);
      });
    });
    var items = document.querySelectorAll(REVEAL_ITEMS);
    for (var i = 0; i < items.length; i++) {
      // Only hide what starts below the first screen, so nothing visible ever blinks out.
      if (items[i].getBoundingClientRect().top < window.innerHeight) continue;
      items[i].classList.add('is-pending', 'is-revealed');
      observer.observe(items[i]);
    }
  }

  // ------------------------------------------------------------- Dialogs --

  function setupDialogs() {
    var openers = document.querySelectorAll('[data-open]');
    for (var i = 0; i < openers.length; i++) {
      openers[i].addEventListener('click', function (event) {
        var button = event.currentTarget;
        var dialog = document.getElementById(button.getAttribute('data-open'));
        if (!dialog) return;
        dialog.showModal();
        dialog.addEventListener('close', function () { button.focus(); }, { once: true });
      });
    }
    // A click on the backdrop lands on the dialog element itself.
    var dialogs = document.querySelectorAll('dialog');
    for (var j = 0; j < dialogs.length; j++) {
      dialogs[j].addEventListener('click', function (event) {
        if (event.target === event.currentTarget) event.currentTarget.close();
      });
    }
  }

  // ------------------------------------------------------------ Lightbox --

  var IMAGE_FILE = /\.(png|jpe?g|gif|webp|avif)$/i;

  function imageList(button) {
    // Read at click time: a deploy script rewrites data-images.
    return (button.getAttribute('data-images') || '')
      .split(',')
      .map(function (s) { return s.trim(); })
      .filter(Boolean);
  }

  function setupGalleries() {
    var buttons = document.querySelectorAll('.btn-gallery[data-gallery-dir]');
    for (var i = 0; i < buttons.length; i++) {
      // An empty folder: hide the button until the deploy script fills the list.
      buttons[i].hidden = imageList(buttons[i]).length === 0;
    }
    // A card whose illustration stands in for missing screenshots shows the
    // first real one as soon as the folder has files.
    var covers = document.querySelectorAll('[data-cover]');
    for (var j = 0; j < covers.length; j++) {
      var source = document.getElementById(covers[j].getAttribute('data-cover'));
      var first = source && imageList(source)[0];
      if (!first || covers[j].querySelector('img')) continue;
      var img = document.createElement('img');
      var name = (source.getAttribute('data-title') || '').replace(/\s*Screenshots$/, '');
      img.alt = (name ? name + ': ' : '') + 'first screenshot';
      img.loading = 'lazy';
      img.addEventListener('load', function (event) {
        event.target.width = event.target.naturalWidth;
        event.target.height = event.target.naturalHeight;
      }, { once: true });
      img.src = first;
      covers[j].classList.remove('view-prep');
      covers[j].classList.add('view-shot');
      covers[j].replaceChildren(img);
    }
  }

  function setupLightbox() {
    var box = document.getElementById('lightbox');
    var img = document.getElementById('lightbox-img');
    var title = document.getElementById('lightbox-title');
    var counter = document.getElementById('lightbox-counter');
    var status = document.getElementById('lightbox-status');
    var repoLink = document.getElementById('lightbox-link');
    var buttons = document.querySelectorAll('.btn-gallery');
    if (!box || !img || !title || !counter || !status || !repoLink || !buttons.length) return;

    var prev = box.querySelector('[data-lightbox="prev"]');
    var next = box.querySelector('[data-lightbox="next"]');
    var close = box.querySelector('[data-lightbox="close"]');
    var images = [];
    var index = 0;
    var opener = null;
    var requestId = 0;

    // The status box shows a message and, when GitHub fails, a way out to the repository.
    function setStatus(text, repo) {
      status.textContent = text;
      repoLink.hidden = !repo;
      if (repo) repoLink.href = 'https://github.com/' + repo;
      status.parentNode.hidden = !text;
    }

    function setNavVisible(visible) {
      prev.hidden = !visible;
      next.hidden = !visible;
    }

    function show(i) {
      if (!images.length) return;
      index = (i + images.length) % images.length;
      var current = ++requestId;
      counter.textContent = index + 1 + ' / ' + images.length;
      box.classList.add('is-loading');
      setStatus('Loading');
      img.alt = title.textContent.replace(/s$/, '') + ' ' + (index + 1) + ' of ' + images.length;
      img.onload = function () {
        if (current !== requestId) return;
        box.classList.remove('is-loading');
        setStatus('');
      };
      img.onerror = function () {
        if (current !== requestId) return;
        box.classList.remove('is-loading');
        img.removeAttribute('src');
        setStatus('This image could not be loaded');
      };
      img.src = images[index];
      // Warm the next image so the arrow keys feel instant.
      if (images.length > 1) new Image().src = images[(index + 1) % images.length];
    }

    function reset() {
      images = [];
      requestId++;
      img.onload = null;
      img.onerror = null;
      img.removeAttribute('src');
      img.alt = '';
      counter.textContent = '';
      setStatus('');
      box.classList.remove('is-loading');
      setNavVisible(false);
    }

    function load(list) {
      images = list;
      setNavVisible(images.length > 1);
      show(0);
      (images.length > 1 ? next : close).focus();
    }

    function open(button) {
      opener = button;
      reset();
      title.textContent = button.getAttribute('data-title') || 'Screenshots';
      box.showModal();
      close.focus();

      var local = imageList(button);
      if (local.length) {
        load(local);
        return;
      }
      if (button.hasAttribute('data-gallery-dir')) {
        setStatus('No screenshots yet');
        return;
      }
      var repo = button.getAttribute('data-repo');
      var folder = button.getAttribute('data-folder') || 'screenshots';
      // Local copies to show when GitHub is unreachable or the folder is empty.
      var fallback = (button.getAttribute('data-fallback') || '').split(',').filter(Boolean);
      var current = ++requestId;
      setStatus('Loading from GitHub');
      fetch('https://api.github.com/repos/' + repo + '/contents/' + folder)
        .then(function (response) {
          if (!response.ok) throw new Error('GitHub answered ' + response.status);
          return response.json();
        })
        .then(function (files) {
          if (current !== requestId) return;
          var found = files
            .filter(function (f) { return f.type === 'file' && IMAGE_FILE.test(f.name); })
            .map(function (f) { return f.download_url; });
          if (found.length) load(found);
          else if (fallback.length) load(fallback);
          else setStatus('No screenshots found', repo);
        })
        .catch(function () {
          if (current !== requestId) return;
          if (fallback.length) load(fallback);
          else setStatus('Could not load the screenshots from GitHub', repo);
        });
    }

    for (var i = 0; i < buttons.length; i++) {
      buttons[i].addEventListener('click', function (event) { open(event.currentTarget); });
    }

    prev.addEventListener('click', function () { show(index - 1); });
    next.addEventListener('click', function () { show(index + 1); });
    close.addEventListener('click', function () { box.close(); });

    box.addEventListener('keydown', function (event) {
      // The native cancel handles real key presses; this also covers synthetic ones.
      if (event.key === 'Escape') {
        event.preventDefault();
        box.close();
        return;
      }
      if (!images.length) return;
      if (event.key === 'ArrowRight') { event.preventDefault(); show(index + 1); }
      else if (event.key === 'ArrowLeft') { event.preventDefault(); show(index - 1); }
      else if (event.key === 'Home') { event.preventDefault(); show(0); }
      else if (event.key === 'End') { event.preventDefault(); show(images.length - 1); }
    });

    // Swipe on touch screens.
    var startX = null;
    box.addEventListener('pointerdown', function (event) {
      if (event.pointerType !== 'mouse') startX = event.clientX;
    });
    box.addEventListener('pointerup', function (event) {
      if (startX === null || images.length < 2) return;
      var dx = event.clientX - startX;
      startX = null;
      if (Math.abs(dx) > 50) show(index + (dx < 0 ? 1 : -1));
    });

    box.addEventListener('close', function () {
      reset();
      if (opener) opener.focus();
    });
  }

  // ---------------------------------------------------------------- Init --

  var initialised = false;

  function init() {
    if (initialised) return;
    initialised = true;
    setupTheme();
    setupSectionMarker();
    setupGalleries();
    setupDialogs();
    setupLightbox();
    setupReveal();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.addEventListener('pageshow', function (event) {
    init();
    // Restored from the back/forward cache: show anything still waiting to reveal.
    if (event.persisted) revealAll();
  });
})();
