/* Ben Mega - "The Editor"
   Loaded in <head> so a saved theme applies before the first paint.
   Everything else waits for the DOM and runs again on pageshow (back/forward
   cache); every setup step is safe to repeat. */
(() => {
  'use strict';

  const root = document.documentElement;
  const THEME_KEY = 'theme';
  const THEME_COLORS = { light: '#efece4', dark: '#0b0f14' };
  const IMAGE_RE = /\.(png|jpe?g|gif|webp|svg)$/i;

  root.classList.add('js');

  const storage = {
    get() {
      try {
        return localStorage.getItem(THEME_KEY);
      } catch {
        return null;
      }
    },
    set(value) {
      try {
        localStorage.setItem(THEME_KEY, value);
      } catch {
        // Storage blocked: the choice lasts until the page is closed.
      }
    },
  };

  const saved = storage.get();
  if (saved === 'light' || saved === 'dark') root.dataset.theme = saved;

  const systemDark = matchMedia('(prefers-color-scheme: dark)');
  const currentTheme = () => root.dataset.theme || (systemDark.matches ? 'dark' : 'light');

  /** A comma separated list attribute, read fresh every time. */
  const listOf = (button, name) =>
    (button.getAttribute(name) || '')
      .split(',')
      .map(item => item.trim())
      .filter(Boolean);
  const imagesOf = button => listOf(button, 'data-images');

  /* ---- Theme toggle ---------------------------------------------------- */
  function setupTheme() {
    const button = document.getElementById('theme-toggle');
    if (!button) return;
    const label = button.querySelector('.theme-label');

    const render = () => {
      const theme = currentTheme();
      button.classList.toggle('is-dark', theme === 'dark');
      // Icon and label both name the theme a click switches to.
      if (label) label.textContent = theme === 'dark' ? 'Light theme' : 'Dark theme';
      button.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`);
      // A manual choice overrides the system colour for the browser chrome too.
      if (root.dataset.theme) {
        document.querySelectorAll('meta[name="theme-color"]').forEach(meta => {
          meta.setAttribute('content', THEME_COLORS[theme]);
        });
      }
    };

    if (!button.dataset.ready) {
      button.dataset.ready = 'true';
      button.addEventListener('click', () => {
        const next = currentTheme() === 'dark' ? 'light' : 'dark';
        root.dataset.theme = next;
        storage.set(next);
        render();
      });
      systemDark.addEventListener('change', render);
    }
    render();
  }

  /* ---- Screenshot lightbox --------------------------------------------- */
  let lightbox = null;

  function createLightbox() {
    const dialog = document.getElementById('lightbox');
    if (!dialog || typeof dialog.showModal !== 'function') return null;

    const img = document.getElementById('lightbox-img');
    const title = document.getElementById('lightbox-title');
    const file = document.getElementById('lightbox-file');
    const counter = document.getElementById('lightbox-counter');
    const status = document.getElementById('lightbox-status');
    const prev = document.getElementById('lightbox-prev');
    const next = document.getElementById('lightbox-next');
    const close = document.getElementById('lightbox-close');

    let images = [];
    let index = 0;
    let opener = null;
    let token = 0; // invalidates loads that finish after the state moved on

    const fileName = src => decodeURIComponent(src.split('/').pop().split('?')[0]);
    // "phone_screenshot_2.png" reads as "phone screenshot 2".
    const describe = src => fileName(src).replace(/\.[a-z0-9]+$/i, '').replace(/[_-]+/g, ' ').trim();
    const project = () => title.textContent.replace(/\s*Screenshots$/, '');

    // Shown as "2 / 10", read as "Screenshot 2 of 10".
    const setCounter = (n, total) => {
      const shown = document.createElement('span');
      shown.setAttribute('aria-hidden', 'true');
      shown.textContent = `${n} / ${total}`;
      const spoken = document.createElement('span');
      spoken.className = 'sr-only';
      spoken.textContent = `Screenshot ${n} of ${total}`;
      counter.replaceChildren(shown, spoken);
    };

    const show = i => {
      index = (i + images.length) % images.length;
      const mine = ++token;
      const src = images[index];
      setCounter(index + 1, images.length);
      file.textContent = fileName(src);
      status.textContent = 'Loading…';
      img.hidden = true;

      const loader = new Image();
      loader.onload = () => {
        if (mine !== token) return;
        img.src = src;
        img.alt = `${project()}, ${describe(src)}`;
        img.hidden = false;
        status.textContent = '';
      };
      loader.onerror = () => {
        if (mine !== token) return;
        status.textContent = 'This screenshot could not be loaded.';
      };
      loader.src = src;
      // Warm the next one so the arrow key feels instant.
      if (images.length > 1) new Image().src = images[(index + 1) % images.length];
    };

    const step = delta => {
      if (images.length > 1) show(index + delta);
    };

    const open = async button => {
      opener = button;
      images = [];
      const mine = ++token;
      title.textContent = button.dataset.title || 'Screenshots';
      counter.replaceChildren();
      file.textContent = '';
      status.textContent = 'Loading…';
      img.hidden = true;
      img.removeAttribute('src');
      prev.hidden = next.hidden = true;
      if (!dialog.open) dialog.showModal();

      // Read at the moment of the click: a deploy script rewrites data-images.
      images = imagesOf(button);
      if (!images.length && button.dataset.repo) {
        try {
          const folder = button.dataset.folder || 'screenshots';
          const response = await fetch(`https://api.github.com/repos/${button.dataset.repo}/contents/${folder}`);
          if (!response.ok) throw new Error(`GitHub responded ${response.status}`);
          const files = await response.json();
          images = files
            .filter(item => item.type === 'file' && IMAGE_RE.test(item.name))
            .map(item => item.download_url);
        } catch {
          // GitHub unreachable or the folder is gone: use the copies on this site.
          images = listOf(button, 'data-fallback-images');
          if (!images.length) {
            if (mine === token) status.textContent = 'The screenshots could not be loaded from GitHub. Please try again later.';
            return;
          }
        }
      }
      if (mine !== token) return;
      if (!images.length) {
        status.textContent = 'No screenshots yet.';
        return;
      }
      prev.hidden = next.hidden = images.length < 2;
      show(0);
    };

    prev.addEventListener('click', () => step(-1));
    next.addEventListener('click', () => step(1));
    close.addEventListener('click', () => dialog.close());
    dialog.addEventListener('keydown', event => {
      if (event.key === 'ArrowRight') step(1);
      else if (event.key === 'ArrowLeft') step(-1);
    });
    // A click on the backdrop closes, as it does for most image viewers.
    dialog.addEventListener('click', event => {
      if (event.target === dialog) dialog.close();
    });

    // Swipe left and right on touch screens.
    let touchX = null;
    dialog.addEventListener('touchstart', event => {
      touchX = event.touches.length === 1 ? event.touches[0].clientX : null;
    }, { passive: true });
    dialog.addEventListener('touchend', event => {
      if (touchX === null) return;
      const dx = event.changedTouches[0].clientX - touchX;
      touchX = null;
      if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
    });

    dialog.addEventListener('close', () => {
      token++;
      img.hidden = true;
      img.removeAttribute('src');
      if (opener && opener.isConnected) opener.focus();
    });

    return { open };
  }

  function setupGalleries() {
    if (!lightbox) lightbox = createLightbox();
    document.querySelectorAll('.btn-gallery').forEach(button => {
      const count = imagesOf(button).length;
      // A folder gallery with no images yet stays hidden until a deploy fills
      // it. Without <dialog> support every gallery stays hidden.
      button.hidden = !lightbox || (!count && !button.dataset.repo);

      // Several buttons read "Screenshots"; the name says whose they are.
      const name = button.dataset.title || 'Screenshots';
      let badge = button.querySelector('.btn-count');
      if (count) {
        if (!badge) {
          badge = document.createElement('span');
          badge.className = 'btn-count';
          badge.setAttribute('aria-hidden', 'true');
          button.append(badge);
        }
        badge.textContent = String(count);
        button.setAttribute('aria-label', `${name} (${count} images)`);
      } else {
        if (badge) badge.remove();
        button.setAttribute('aria-label', name);
      }

      if (button.dataset.ready) return;
      button.dataset.ready = 'true';
      button.addEventListener('click', () => lightbox.open(button));
    });
  }

  /* ---- Request access dialog ------------------------------------------- */
  let accessOpener = null;

  function setupAccessDialog() {
    const dialog = document.getElementById('access-dialog');
    if (!dialog || typeof dialog.showModal !== 'function') return;

    if (!dialog.dataset.ready) {
      dialog.dataset.ready = 'true';
      dialog.addEventListener('click', event => {
        if (event.target === dialog) dialog.close();
      });
      dialog.addEventListener('close', () => {
        if (accessOpener && accessOpener.isConnected) accessOpener.focus();
      });
    }

    // Without JavaScript these links start an email; with it, they open the
    // dialog, so they are announced and operated as buttons.
    document.querySelectorAll('.btn-access').forEach(link => {
      if (link.dataset.ready) return;
      link.dataset.ready = 'true';
      link.setAttribute('role', 'button');
      link.setAttribute('aria-haspopup', 'dialog');
      link.addEventListener('click', event => {
        event.preventDefault();
        accessOpener = link;
        dialog.showModal();
      });
      link.addEventListener('keydown', event => {
        if (event.key !== ' ') return;
        event.preventDefault();
        link.click();
      });
    });
  }

  /* ---- Scroll spy: tabs, explorer, title, breadcrumb and status bar ---- */
  function setupScrollSpy() {
    const files = Array.from(document.querySelectorAll('main [data-file]'));
    const links = Array.from(document.querySelectorAll('[data-spy]'));
    const titleFile = document.querySelector('.titlebar-file');
    const crumbPath = document.querySelector('.crumbs-path');
    const statusLang = document.querySelector('.status-lang');
    const head = document.querySelector('.editor-head');
    if (!files.length || !links.length) return;

    let current = '';
    const activate = file => {
      if (file.id === current) return;
      current = file.id;
      const section = file.closest('section');
      links.forEach(link => {
        const wanted = link.classList.contains('tab') ? section.id : file.id;
        if (link.dataset.spy === wanted) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
      if (titleFile) titleFile.textContent = file.dataset.file;
      if (crumbPath) {
        crumbPath.textContent = file === section ? file.dataset.file : `${section.dataset.file} › ${file.dataset.file}`;
      }
      if (statusLang) statusLang.textContent = section.dataset.lang || '';

      // Keep the active tab in view when the tab bar scrolls sideways.
      const tab = document.querySelector('.tab[aria-current]');
      const list = tab && tab.closest('.tabs-list');
      if (list && list.scrollWidth > list.clientWidth) {
        const t = tab.getBoundingClientRect();
        const l = list.getBoundingClientRect();
        if (t.left < l.left || t.right > l.right) list.scrollTo({ left: tab.offsetLeft - 12 });
      }
    };

    const update = () => {
      const top = head ? head.getBoundingClientRect().bottom : 0;
      const line = top + (innerHeight - top) * 0.3;
      const atBottom = innerHeight + scrollY >= root.scrollHeight - 4;
      let active = files[0];
      if (atBottom) {
        active = files[files.length - 1];
      } else {
        for (const file of files) {
          if (file.getBoundingClientRect().top <= line) active = file;
        }
      }
      activate(active);
    };

    if (!root.dataset.spyReady) {
      root.dataset.spyReady = 'true';
      let ticking = false;
      const onScroll = () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
          ticking = false;
          update();
        });
      };
      addEventListener('scroll', onScroll, { passive: true });
      addEventListener('resize', onScroll);
    }
    current = '';
    update();
  }

  /* ---- Preview panes fade in as they arrive ---------------------------- */
  function setupReveal() {
    if (!('IntersectionObserver' in window)) return;
    const panes = document.querySelectorAll('.preview:not(.reveal)');
    if (!panes.length) return;
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px 10% 0px' });
    panes.forEach(pane => {
      // Panes already on screen are shown at once, never hidden first.
      const r = pane.getBoundingClientRect();
      if (r.top < innerHeight && r.bottom > 0) return;
      pane.classList.add('reveal');
      observer.observe(pane);
    });
  }

  function setup() {
    setupTheme();
    setupGalleries();
    setupAccessDialog();
    setupScrollSpy();
    setupReveal();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup);
  else setup();
  addEventListener('pageshow', setup);
})();
