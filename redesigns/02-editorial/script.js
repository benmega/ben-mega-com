/* Behaviour for the page: edition (theme) switch, reveal on scroll, the
   request-access dialog and the screenshot lightbox.

   Loaded synchronously in <head>, so the two things that must be in place
   before the first paint happen at once: the html.js class and the saved
   edition. Everything else runs as soon as the document is parsed (never
   waiting for images or fonts), and again when the page comes back from the
   back/forward cache; setup is safe to run twice. */
(() => {
  'use strict';

  const root = document.documentElement;
  root.classList.add('js');

  // --- Edition (theme) -----------------------------------------------------
  const THEME_KEY = 'edition';
  const prefersDark = matchMedia('(prefers-color-scheme: dark)');

  const storedTheme = () => {
    try {
      return localStorage.getItem(THEME_KEY);
    } catch {
      return null;
    }
  };

  const applyTheme = theme => {
    root.dataset.theme = theme;
    // With a manual choice the media-scoped theme-color metas may disagree
    // with the page, so both take the paper colour that is actually in use.
    const paper = getComputedStyle(root).getPropertyValue('--paper').trim();
    if (paper) {
      document.querySelectorAll('meta[name="theme-color"]').forEach(meta => meta.setAttribute('content', paper));
    }
  };

  const isDark = () => (root.dataset.theme ? root.dataset.theme === 'dark' : prefersDark.matches);

  const saved = storedTheme();
  if (saved === 'light' || saved === 'dark') root.dataset.theme = saved;

  // --- Helpers -------------------------------------------------------------
  const parseList = value =>
    String(value ?? '')
      .split(',')
      .map(item => item.trim())
      .filter(Boolean);

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

  let bound = false;

  function setup() {
    if (root.dataset.theme) applyTheme(root.dataset.theme);
    refreshGalleryButtons();
    revealOnScroll();
    // Turns off the CSS safety net that shows .reveal blocks on its own
    root.classList.add('is-ready');
    if (bound) return;
    bound = true;
    enableDeferredStyles();
    bindThemeToggle();
    bindAccessDialog();
    bindLightbox();
  }

  // --- Deferred stylesheets ------------------------------------------------
  // The icon font arrives as a print sheet so it never blocks rendering; it
  // is switched on once loaded. If the CDN fails, the names still show.
  function enableDeferredStyles() {
    document.querySelectorAll('link[data-deferred-style]').forEach(link => {
      const enable = () => {
        link.media = 'all';
      };
      if (link.sheet) enable();
      else link.addEventListener('load', enable, { once: true });
    });
  }

  // --- Theme toggle --------------------------------------------------------
  function bindThemeToggle() {
    const toggle = document.querySelector('[data-theme-toggle]');
    if (!toggle) return;
    toggle.addEventListener('click', () => {
      const next = isDark() ? 'light' : 'dark';
      applyTheme(next);
      try {
        localStorage.setItem(THEME_KEY, next);
      } catch {
        // Storage may be unavailable (private mode); the choice still applies now.
      }
    });
  }

  // --- Reveal on scroll ----------------------------------------------------
  // One observer for the life of the page; observing a node twice is a no-op.
  let revealObserver = null;

  function revealOnScroll() {
    const items = document.querySelectorAll('.reveal:not(.is-in)');
    if (reducedMotion.matches || !('IntersectionObserver' in window)) {
      items.forEach(el => el.classList.add('is-in'));
      return;
    }
    revealObserver ??= new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add('is-in');
          revealObserver.unobserve(entry.target);
        }
      },
      { threshold: 0 },
    );
    items.forEach(el => revealObserver.observe(el));
  }

  // --- Gallery buttons -----------------------------------------------------
  // A folder gallery (data-gallery-dir) is only offered while its list has
  // images. scripts/update-galleries.mjs rewrites data-images between
  // deploys, so the list is read from the attribute, never copied here.
  function refreshGalleryButtons() {
    document.querySelectorAll('.btn-gallery[data-gallery-dir]').forEach(btn => {
      const images = parseList(btn.getAttribute('data-images'));
      btn.hidden = images.length === 0;
      const count = btn.querySelector('[data-count]');
      if (count) count.textContent = images.length ? `(${images.length})` : '';

      // A project without hand-picked pictures shows its first screenshot
      // on the page as soon as the folder has one. The screenshot then takes
      // the place of the drawing, and the caption changes with it.
      const preview = btn.id && document.querySelector(`[data-preview-for="${btn.id}"]`);
      if (!preview) return;
      const filled = images.length > 0;
      const figure = preview.closest('figure');
      preview.hidden = !filled;
      figure.querySelectorAll('[data-drawing], [data-caption-empty]').forEach(el => {
        el.hidden = filled;
      });
      figure.querySelector('[data-caption-filled]').hidden = !filled;
      const img = preview.querySelector('img');
      if (filled && img.getAttribute('src') !== images[0]) img.src = images[0];
    });
  }

  // --- Request access dialog -----------------------------------------------
  function bindAccessDialog() {
    const dialog = document.getElementById('access');
    if (!dialog) return;
    const project = dialog.querySelector('[data-access-project]');
    const email = dialog.querySelector('[data-access-email]');
    // Each trigger is a mailto link with the project in the subject, so it
    // works without JavaScript. The dialog names the project and its Email
    // button writes that same email.
    document.querySelectorAll('[data-open="access"]').forEach(link => {
      link.addEventListener('click', event => {
        event.preventDefault();
        const name = link.dataset.project;
        project.textContent = name || '';
        email.href = link.href;
        dialog.showModal();
      });
    });
    dialog.querySelectorAll('[data-close]').forEach(btn => {
      btn.addEventListener('click', () => dialog.close());
    });
    dialog.addEventListener('click', event => {
      if (event.target === dialog) dialog.close();
    });
    closeOnEscape(dialog);
  }

  // Native dialogs close on Escape already, but browsers may skip that after
  // repeated presses; closing explicitly keeps it reliable.
  function closeOnEscape(dialog) {
    dialog.addEventListener('keydown', event => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      dialog.close();
    });
  }

  // --- Lightbox ------------------------------------------------------------
  function bindLightbox() {
    const dialog = document.getElementById('lightbox');
    if (!dialog) return;
    const img = dialog.querySelector('[data-image]');
    const title = dialog.querySelector('#lightbox-title');
    const counterNow = dialog.querySelector('[data-counter-now]');
    const counterTotal = dialog.querySelector('[data-counter-total]');
    const caption = dialog.querySelector('[data-caption]');
    const status = dialog.querySelector('[data-status]');
    const prev = dialog.querySelector('[data-prev]');
    const next = dialog.querySelector('[data-next]');
    const close = dialog.querySelector('[data-close]');
    const IMAGE_FILE = /\.(png|jpe?g|gif|webp)$/i;

    let images = [];
    let index = 0;
    let opener = null;
    let request = 0;
    // A GitHub gallery is asked once per page; its answer is reused.
    const remoteLists = new WeakMap();

    const setStatus = text => {
      status.textContent = text;
    };

    const pad = n => String(n).padStart(2, '0');

    const setCounter = (now, total) => {
      counterNow.textContent = now ? pad(now) : '';
      counterTotal.textContent = total ? `/${pad(total)}` : '';
    };

    const setNav = () => {
      const single = images.length < 2;
      prev.disabled = single;
      next.disabled = single;
    };

    const show = i => {
      if (!images.length) return;
      index = (i + images.length) % images.length;
      img.hidden = true;
      setStatus('Loading…');
      // The list changes between deploys, so the text is generic rather than
      // guessed from file names.
      const project = title.textContent.replace(/\s*Screenshots$/, '');
      const label = `${project} screenshot ${index + 1} of ${images.length}`;
      caption.textContent = label;
      img.alt = label;
      img.src = images[index];
      setCounter(index + 1, images.length);
      if (images.length > 1) new Image().src = images[(index + 1) % images.length];
    };

    // A folder gallery reads data-images at the moment of the click. A GitHub
    // gallery asks the API, and falls back to its hand-picked data-fallback
    // list when the API fails (missing folder, rate limit, offline).
    const listImages = async btn => {
      if (btn.hasAttribute('data-gallery-dir')) return parseList(btn.getAttribute('data-images'));
      if (!remoteLists.has(btn)) {
        const pending = fetchRemoteList(btn);
        remoteLists.set(btn, pending);
        // A failure is not kept, so the next click asks again.
        pending.catch(() => remoteLists.delete(btn));
      }
      return remoteLists.get(btn);
    };

    const fetchRemoteList = async btn => {
      const fallback = parseList(btn.getAttribute('data-fallback'));
      const repo = btn.getAttribute('data-repo');
      const folder = btn.getAttribute('data-folder') || 'screenshots';
      try {
        const response = await fetch(`https://api.github.com/repos/${repo}/contents/${folder}`);
        if (!response.ok) throw new Error(`GitHub answered ${response.status}`);
        const files = await response.json();
        const list = files
          .filter(file => file.type === 'file' && IMAGE_FILE.test(file.name))
          .map(file => file.download_url);
        if (list.length) return list;
      } catch (error) {
        if (!fallback.length) throw error;
      }
      return fallback;
    };

    // returnTo is where focus goes on close: the control that was pressed.
    const open = async (btn, returnTo = btn) => {
      opener = returnTo;
      const current = ++request;
      images = [];
      index = 0;
      title.textContent = btn.getAttribute('data-title') || 'Screenshots';
      setCounter(0, 0);
      caption.textContent = '';
      img.hidden = true;
      img.removeAttribute('src');
      img.alt = '';
      setNav();
      setStatus('Loading…');
      if (!dialog.open) dialog.showModal();
      close.focus();
      try {
        const list = await listImages(btn);
        if (current !== request) return;
        images = list;
        setNav();
        if (!images.length) {
          setStatus('No screenshots yet.');
          return;
        }
        show(0);
      } catch {
        if (current === request) setStatus('The screenshots could not be loaded. Please try again later.');
      }
    };

    document.querySelectorAll('.btn-gallery').forEach(btn => {
      btn.addEventListener('click', () => open(btn));
    });
    document.querySelectorAll('[data-preview-for]').forEach(preview => {
      const btn = document.getElementById(preview.dataset.previewFor);
      if (btn) preview.addEventListener('click', () => open(btn, preview));
    });

    img.addEventListener('load', () => {
      img.hidden = false;
      setStatus('');
    });
    img.addEventListener('error', () => {
      if (!img.getAttribute('src')) return;
      img.hidden = true;
      setStatus('This image could not be loaded.');
    });

    prev.addEventListener('click', () => show(index - 1));
    next.addEventListener('click', () => show(index + 1));
    close.addEventListener('click', () => dialog.close());

    dialog.addEventListener('keydown', event => {
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        show(index + 1);
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        show(index - 1);
      }
    });
    closeOnEscape(dialog);

    dialog.addEventListener('close', () => {
      request++;
      img.removeAttribute('src');
      img.hidden = true;
      if (opener && opener.isConnected) opener.focus();
      opener = null;
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    setup();
  }
  // pageshow also fires on a back/forward cache restore, where
  // DOMContentLoaded does not; running setup again is harmless.
  window.addEventListener('pageshow', setup);
})();
