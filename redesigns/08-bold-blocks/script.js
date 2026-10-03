// This file is loaded first in <head>, before the stylesheets, so the lines
// below run before the page is painted: the saved theme applies without a
// flash, and .js lets the stylesheet hide reveal elements only when they can
// be shown again. Everything that needs the DOM waits for DOMContentLoaded,
// which does not wait for images.
//
// Everything runs inside one function, so nothing is added to the global
// scope where another script could collide with it.

(() => {
  const root = document.documentElement;
  root.classList.add('js');

  const THEME_KEY = 'theme';

  function storedTheme() {
    try {
      return localStorage.getItem(THEME_KEY);
    } catch {
      return null;
    }
  }

  // The same values as --paper in styles.css, for the browser's own chrome.
  const THEME_COLORS = { light: '#FFF4DE', dark: '#14121B' };

  function applyTheme(theme) {
    const manual = theme === 'light' || theme === 'dark';
    if (manual) root.dataset.theme = theme;
    else delete root.dataset.theme;

    // Each theme-color tag answers one system scheme; a manual choice sets both.
    document.querySelectorAll('meta[name="theme-color"]').forEach(meta => {
      const own = (meta.getAttribute('media') || '').includes('dark') ? 'dark' : 'light';
      meta.setAttribute('content', THEME_COLORS[manual ? theme : own]);
    });
  }

  applyTheme(storedTheme());

  // ---------------------------------------------------------------------------
  // Theme toggle
  // ---------------------------------------------------------------------------

  function setupTheme() {
    const toggle = document.querySelector('.theme-toggle');
    if (!toggle) return;
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)');

    const current = () => root.dataset.theme || (systemDark.matches ? 'dark' : 'light');
    const sync = () => {
      toggle.setAttribute('aria-label', `Switch to ${current() === 'dark' ? 'light' : 'dark'} theme`);
    };

    toggle.addEventListener('click', () => {
      const next = current() === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      try {
        localStorage.setItem(THEME_KEY, next);
      } catch {
        // Private mode or storage disabled: the choice lasts for this page only.
      }
      sync();
    });
    systemDark.addEventListener('change', sync);
    sync();
  }

  // ---------------------------------------------------------------------------
  // Reveal on scroll
  // ---------------------------------------------------------------------------

  const reveals = () => document.querySelectorAll('.reveal');

  function setupReveal() {
    if (!('IntersectionObserver' in window)) {
      revealAll();
      return;
    }
    const observer = new IntersectionObserver((entries, obs) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-in');
        obs.unobserve(entry.target);
      }
    });
    reveals().forEach(el => observer.observe(el));
  }

  function revealAll() {
    reveals().forEach(el => el.classList.add('is-in'));
  }

  // Anything already on screen must be visible: a back/forward restore or a
  // scroll position kept by the browser may skip the observer.
  function revealVisible() {
    reveals().forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) el.classList.add('is-in');
    });
  }

  // ---------------------------------------------------------------------------
  // Request access dialog
  // ---------------------------------------------------------------------------

  function setupAccessDialog() {
    const dialog = document.getElementById('access');
    if (!dialog) return;
    const email = document.getElementById('access-email');
    const project = document.getElementById('access-project');
    let opener = null;

    document.querySelectorAll('.btn-request').forEach(link => {
      link.addEventListener('click', event => {
        event.preventDefault();
        // The link's own mailto (with the project in the subject) becomes the
        // dialog's email button, and stays the fallback without JavaScript.
        email.href = link.getAttribute('href');
        project.textContent = link.dataset.project || 'Private repository';
        opener = link;
        dialog.showModal();
      });
    });

    dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => {
      if (event.target === dialog) dialog.close();
    });
    dialog.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        event.preventDefault();
        dialog.close();
      }
    });
    dialog.addEventListener('close', () => opener?.focus());
  }

  // ---------------------------------------------------------------------------
  // Screenshot galleries
  // ---------------------------------------------------------------------------

  // Read at the moment it is needed: scripts/update-galleries.mjs rewrites
  // data-images between deploys.
  const imagesOf = (button, attribute = 'data-images') =>
    (button.getAttribute(attribute) || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

  const IMAGE_FILE = /\.(png|jpe?g|gif|webp|svg)$/i;

  async function fetchGitHubImages(repo, folder) {
    const response = await fetch(`https://api.github.com/repos/${repo}/contents/${folder}`);
    if (!response.ok) throw new Error(`GitHub answered ${response.status}`);
    const files = await response.json();
    return files
      .filter(file => file.type === 'file' && IMAGE_FILE.test(file.name))
      .map(file => file.download_url);
  }

  // Set by setupLightbox: openGallery(button, startIndex, returnFocusTo).
  let openGallery = null;

  function setupLightbox() {
    const dialog = document.getElementById('lightbox');
    if (!dialog) return;
    const img = document.getElementById('lightbox-img');
    const title = document.getElementById('lightbox-title');
    const count = document.getElementById('lightbox-count');
    const status = document.getElementById('lightbox-status');
    const figure = img.closest('figure');
    const prev = dialog.querySelector('[data-prev]');
    const next = dialog.querySelector('[data-next]');

    let images = [];
    let index = 0;
    let name = 'Screenshots';
    let request = 0;       // bumped on every change, so late loads are ignored
    let opener = null;

    const setStatus = text => {
      status.textContent = text;
    };

    // Nothing to page through: no arrows at all, rather than dimmed ones.
    const setPaging = on => {
      prev.hidden = next.hidden = !on;
    };

    function show(i) {
      if (!images.length) return;
      index = (i + images.length) % images.length;
      const src = images[index];
      const id = ++request;

      count.textContent = `${index + 1} / ${images.length}`;
      setPaging(images.length > 1);
      img.hidden = true;
      setStatus('Loading…');

      const loader = new Image();
      loader.onload = () => {
        if (id !== request) return;
        figure.style.setProperty('--ar', `${loader.naturalWidth} / ${loader.naturalHeight}`);
        img.src = src;
        img.alt = `${name}, image ${index + 1} of ${images.length}`;
        img.hidden = false;
        setStatus('');
      };
      loader.onerror = () => {
        if (id !== request) return;
        setStatus(`Image ${index + 1} could not be loaded.`);
      };
      loader.src = src;

      // Warm the next one so arrow keys feel instant.
      if (images.length > 1) new Image().src = images[(index + 1) % images.length];
    }

    function open(button, start = 0, returnTo = button) {
      name = button.getAttribute('data-title') || 'Screenshots';
      opener = returnTo;
      title.textContent = name;
      count.textContent = '';
      images = [];
      const id = ++request;
      img.hidden = true;
      img.removeAttribute('src');
      figure.style.removeProperty('--ar');
      setPaging(false);
      setStatus('Loading…');
      dialog.showModal();

      if (button.hasAttribute('data-gallery-dir')) {
        images = imagesOf(button);
        if (images.length) show(start);
        else setStatus('No screenshots yet.');
        return;
      }

      const repo = button.getAttribute('data-repo');
      const folder = button.getAttribute('data-folder') || 'screenshots';
      // data-fallback holds a few screenshots shipped with the site, shown when
      // the repository cannot be read.
      const fallback = imagesOf(button, 'data-fallback');
      fetchGitHubImages(repo, folder)
        .catch(() => [])
        .then(list => {
          if (id !== request) return;
          images = list.length ? list : fallback;
          if (images.length) {
            show(start);
            return;
          }
          status.replaceChildren(
            'Could not load the screenshots from GitHub. ',
            Object.assign(document.createElement('a'), {
              href: `https://github.com/${repo}`,
              target: '_blank',
              rel: 'noopener noreferrer',
              textContent: 'Open the repository on GitHub',
            })
          );
        });
    }

    openGallery = open;
    document.querySelectorAll('.btn-gallery').forEach(button => {
      button.addEventListener('click', () => open(button));
    });

    prev.addEventListener('click', () => show(index - 1));
    next.addEventListener('click', () => show(index + 1));
    dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => {
      if (event.target === dialog) dialog.close();
    });
    dialog.addEventListener('keydown', event => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        show(index - 1);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        show(index + 1);
      } else if (event.key === 'Escape') {
        event.preventDefault();
        dialog.close();
      }
    });
    dialog.addEventListener('close', () => {
      request++;
      img.removeAttribute('src');
      opener?.focus();
    });

    // Swipe between images on touch screens.
    let startX = null;
    dialog.addEventListener('touchstart', event => {
      startX = event.touches.length === 1 ? event.touches[0].clientX : null;
    }, { passive: true });
    dialog.addEventListener('touchend', event => {
      if (startX === null || images.length < 2) return;
      const dx = event.changedTouches[0].clientX - startX;
      startX = null;
      if (Math.abs(dx) > 48) show(index + (dx < 0 ? 1 : -1));
    });
  }

  // Galleries whose folder is empty today (Auto-Prep) hide their button until
  // the deploy script lists images. Cards with a [data-shots] area also get
  // thumbnails (one large, plus two small once there are three or more), each
  // opening the lightbox at that image.
  function syncGalleryButtons() {
    document.querySelectorAll('.btn-gallery[data-gallery-dir]').forEach(button => {
      const images = imagesOf(button);
      button.hidden = images.length === 0;

      const counter = button.querySelector('[data-count]');
      if (counter) counter.textContent = images.length ? `(${images.length})` : '';

      const card = button.closest('.card');
      const strip = card?.querySelector('[data-shots]');
      if (!strip) return;
      strip.hidden = images.length === 0;
      card.classList.toggle('card--has-shots', images.length > 0);
      if (!images.length) return;

      strip.replaceChildren(
        ...images.slice(0, images.length >= 3 ? 3 : 1).map((src, i) => {
          const shot = document.createElement('button');
          shot.type = 'button';
          shot.className = 'shot';
          shot.setAttribute('aria-label', `Open screenshot ${i + 1} of ${images.length}`);
          const thumb = new Image();
          thumb.src = src;
          thumb.alt = '';
          thumb.loading = 'lazy';
          thumb.width = 800;
          thumb.height = 500;
          shot.append(thumb);
          shot.addEventListener('click', () => openGallery?.(button, i, shot));
          return shot;
        })
      );
    });
  }

  // ---------------------------------------------------------------------------
  // Start. Setup runs once, as soon as the document is parsed; it must not wait
  // for the load event, which waits for every image. A back/forward cache
  // restore fires pageshow with persisted set, and only needs the refresh.
  // ---------------------------------------------------------------------------

  let started = false;

  function refresh() {
    syncGalleryButtons();
    revealVisible();
  }

  function start() {
    if (started) return;
    started = true;
    setupTheme();
    setupAccessDialog();
    setupLightbox();
    setupReveal();
    refresh();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }

  window.addEventListener('pageshow', event => {
    if (event.persisted) refresh();
  });
})();
