(() => {
  'use strict';

  // Reveal styles and JavaScript-only controls apply once this has run.
  document.documentElement.classList.add('js');

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const listFrom = value =>
    (value || '')
      .split(',')
      .map(item => item.trim())
      .filter(Boolean);

  // "assets/auto-prep/question_bank_editor.png" -> "question bank editor".
  // Empty when the file name has no words in it ("IMG_0042.png").
  const wordsFromFile = src => {
    let file = src.split(/[?#]/)[0].split('/').pop() || '';
    try {
      file = decodeURIComponent(file);
    } catch {
      // Keep the name as it is.
    }
    const words = file
      .replace(/\.[a-z0-9]+$/i, '')
      .replace(/[_-]+/g, ' ')
      .trim();
    return /[a-z]{3}/i.test(words) ? words : '';
  };

  const projectOf = button => (button.dataset.title || 'Screenshots').replace(/ Screenshots$/, '');

  // ---------------------------------------------------------------------------
  // Header: a hairline once the page scrolls, and the section in view
  // ---------------------------------------------------------------------------

  function setupHeader() {
    const header = document.querySelector('.site-header');
    if (!header) return;
    const links = Array.from(document.querySelectorAll('.nav-links a[href^="#"]'));
    const sections = links.map(link => document.querySelector(link.getAttribute('href')));

    let queued = false;
    const update = () => {
      queued = false;
      header.classList.toggle('is-scrolled', window.scrollY > 8);

      // The current section is the last one whose top has passed a line a
      // third of the way down the screen. Above the first one, none is.
      const line = window.innerHeight / 3;
      let current = -1;
      sections.forEach((section, i) => {
        if (section && section.getBoundingClientRect().top <= line) current = i;
      });
      // At the very bottom the last section counts, even if it is short.
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
        current = sections.length - 1;
      }
      links.forEach((link, i) => {
        if (i === current) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      });
    };

    const onScroll = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(update);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    update();
  }

  // ---------------------------------------------------------------------------
  // Scroll reveal
  // ---------------------------------------------------------------------------

  const REVEAL_MS = 400;
  const revealItems = () => Array.from(document.querySelectorAll('.reveal'));

  // Shows an element, then drops the reveal class and the stagger once it has
  // arrived. The element keeps its own transitions (a card's hover lift) and
  // no delay is left behind on them. .is-in stays, as a record that it was seen.
  const reveal = (el, delay = 0) => {
    if (el.classList.contains('is-in')) return;
    if (delay) el.style.transitionDelay = `${delay}ms`;
    el.classList.add('is-in');
    setTimeout(() => {
      el.classList.remove('reveal');
      el.style.transitionDelay = '';
    }, delay + REVEAL_MS + 50);
  };
  const revealAll = () => revealItems().forEach(el => reveal(el));

  function setupReveal() {
    const items = revealItems();
    if (!('IntersectionObserver' in window) || reducedMotion.matches) {
      revealAll();
      return;
    }

    const observer = new IntersectionObserver(
      (entries, obs) => {
        // A small stagger for items that arrive together, capped so nothing waits long.
        entries
          .filter(entry => entry.isIntersecting)
          .forEach((entry, index) => {
            reveal(entry.target, Math.min(index * 70, 210));
            obs.unobserve(entry.target);
          });
      },
      { threshold: 0 },
    );
    items.forEach(el => observer.observe(el));

    // Safety net: anything on screen that the observer has not shown within a
    // moment (a browser quirk, a jump to an anchor) is shown anyway.
    setTimeout(() => {
      items.forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) reveal(el);
      });
    }, 500);
  }

  // ---------------------------------------------------------------------------
  // Dialogs: "Request access"; a click on the backdrop closes it.
  // Without JavaScript (or <dialog>) the "Private code" links go to Contact.
  // ---------------------------------------------------------------------------

  function setupDialogs() {
    document.querySelectorAll('[data-open-dialog]').forEach(trigger => {
      const dialog = document.getElementById(trigger.dataset.openDialog);
      if (!dialog || typeof dialog.showModal !== 'function') return;
      trigger.addEventListener('click', event => {
        event.preventDefault();
        dialog.showModal();
      });
    });

    document.querySelectorAll('dialog.dialog').forEach(dialog => {
      dialog.addEventListener('click', event => {
        // The inner wrapper fills the box, so a click on the dialog element
        // itself landed on the backdrop.
        if (event.target === dialog) dialog.close();
      });
    });
  }

  // ---------------------------------------------------------------------------
  // Screenshot galleries
  // ---------------------------------------------------------------------------

  // scripts/update-galleries.mjs rewrites data-images before every deploy.
  // The gallery button covers the card picture. A folder gallery with nothing
  // in it yet is hidden, and shown once it has screenshots, without anyone
  // touching the HTML. Auto-Prep has none today: once it has, the first one
  // also becomes the card picture.
  function syncGalleries() {
    document.querySelectorAll('.btn-gallery[data-gallery-dir]').forEach(button => {
      const images = listFrom(button.dataset.images);
      button.hidden = images.length === 0;

      const media = button.closest('[data-gallery-thumb]');
      if (!media || !images.length || media.querySelector('.window')) return;

      // The same browser window frame the other desktop projects use.
      const frame = document.createElement('div');
      frame.className = 'window';
      frame.innerHTML = '<span class="window-bar" aria-hidden="true"><span></span><span></span><span></span></span>';
      // The frame crops with object-fit, so any 16:10 size keeps the layout still.
      const thumb = document.createElement('img');
      thumb.width = 1280;
      thumb.height = 800;
      thumb.loading = 'lazy';
      thumb.alt = `${projectOf(button)}: ${wordsFromFile(images[0]) || 'screenshot 1'}`;
      thumb.src = images[0];
      thumb.addEventListener('error', () => {
        frame.remove();
        media.classList.remove('has-thumb');
      });
      frame.append(thumb);
      media.insertBefore(frame, button);
      media.classList.add('has-thumb');
    });
  }

  function setupGalleries() {
    const box = document.getElementById('lightbox');
    if (!box || typeof box.showModal !== 'function') return;

    const img = box.querySelector('.lightbox-img');
    const titleEl = box.querySelector('.lightbox-title');
    const counter = box.querySelector('.lightbox-counter');
    const status = box.querySelector('.lightbox-status');
    const link = box.querySelector('.lightbox-link');
    const closeBtn = box.querySelector('.lightbox-close');
    const prevBtn = box.querySelector('.lightbox-prev');
    const nextBtn = box.querySelector('.lightbox-next');
    const imageFile = /\.(png|jpe?g|gif|webp|avif)$/i;

    let images = [];
    let index = 0;
    let project = '';
    let requestId = 0;
    let opener = null;

    // The arrows only show when there is somewhere to go.
    const setNav = enabled => {
      prevBtn.hidden = !enabled;
      nextBtn.hidden = !enabled;
    };

    const preload = i => {
      const src = images[(i + images.length) % images.length];
      if (src) new Image().src = src;
    };

    // "Fractal Defense: active gameplay (2 of 3)", named after the file.
    const describe = (src, n, total) => {
      const words = wordsFromFile(src);
      return words ? `${project}: ${words} (${n} of ${total})` : `${project}, screenshot ${n} of ${total}`;
    };

    // A message in place of the picture: the gallery is empty or failed.
    // The link to the repository is offered only when GitHub was the source.
    const setMessage = (text, repo = '') => {
      status.textContent = text;
      box.classList.toggle('has-message', Boolean(text));
      link.hidden = !repo;
      if (repo) link.href = `https://github.com/${repo}`;
    };

    const show = i => {
      index = (i + images.length) % images.length;
      box.classList.add('is-loading');
      setMessage('');
      img.alt = describe(images[index], index + 1, images.length);
      img.src = images[index];
      counter.textContent = `${index + 1} / ${images.length}`;
      if (images.length > 1) {
        preload(index + 1);
        preload(index - 1);
      }
    };

    img.addEventListener('load', () => box.classList.remove('is-loading'));
    img.addEventListener('error', () => {
      if (!img.getAttribute('src')) return;
      box.classList.remove('is-loading');
      img.removeAttribute('src');
      setMessage('This screenshot could not be loaded.');
    });

    const fetchRepoImages = async (repo, folder) => {
      const response = await fetch(`https://api.github.com/repos/${repo}/contents/${folder}`);
      if (!response.ok) throw new Error(`GitHub answered ${response.status}`);
      const files = await response.json();
      return files
        .filter(file => file.type === 'file' && imageFile.test(file.name))
        .map(file => file.download_url);
    };

    const open = async button => {
      const id = ++requestId;
      opener = button;
      project = projectOf(button);
      images = [];
      titleEl.textContent = button.dataset.title || 'Screenshots';
      counter.textContent = '';
      setMessage('');
      img.removeAttribute('src');
      img.alt = '';
      setNav(false);
      box.classList.add('is-loading');
      box.showModal();
      closeBtn.focus();

      let list;
      try {
        // Read at the moment of the click: the deploy script changes this list.
        list = button.dataset.repo
          ? await fetchRepoImages(button.dataset.repo, button.dataset.folder || 'screenshots')
          : listFrom(button.dataset.images);
      } catch {
        list = [];
      }
      if (id !== requestId || !box.open) return;

      // A repository gallery that GitHub cannot serve falls back to the
      // screenshots kept on this site.
      if (!list.length && button.dataset.repo) {
        list = listFrom(button.dataset.fallback);
        if (!list.length) {
          box.classList.remove('is-loading');
          setMessage('The screenshots could not be loaded from GitHub. Please try again later.', button.dataset.repo);
          return;
        }
      }

      if (!list.length) {
        box.classList.remove('is-loading');
        setMessage('There are no screenshots here yet.');
        return;
      }
      images = list;
      setNav(images.length > 1);
      show(0);
    };

    document.querySelectorAll('.btn-gallery').forEach(button => {
      button.addEventListener('click', () => open(button));
    });

    prevBtn.addEventListener('click', () => images.length && show(index - 1));
    nextBtn.addEventListener('click', () => images.length && show(index + 1));

    box.addEventListener('keydown', event => {
      if (!images.length) return;
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        show(index + 1);
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        show(index - 1);
      }
    });

    // Swipe on touch screens.
    let touchX = null;
    box.addEventListener('touchstart', event => (touchX = event.touches[0].clientX), { passive: true });
    box.addEventListener(
      'touchend',
      event => {
        if (touchX === null || images.length < 2) return;
        const dx = event.changedTouches[0].clientX - touchX;
        touchX = null;
        if (Math.abs(dx) > 48) show(index + (dx < 0 ? 1 : -1));
      },
      { passive: true },
    );

    // A click on the dark area around the picture closes the lightbox.
    box.addEventListener('click', event => {
      if (event.target.closest('.lightbox-img, .lightbox-btn, .lightbox-bar, .lightbox-link')) return;
      box.close();
    });

    box.addEventListener('close', () => {
      requestId++;
      images = [];
      img.removeAttribute('src');
      box.classList.remove('is-loading');
      setMessage('');
      if (opener && document.contains(opener)) opener.focus();
      opener = null;
    });
  }

  // ---------------------------------------------------------------------------
  // Copy the email address
  // ---------------------------------------------------------------------------

  function setupCopy() {
    document.querySelectorAll('[data-copy]').forEach(button => {
      if (!navigator.clipboard || !window.isSecureContext) {
        button.hidden = true;
        return;
      }
      const label = button.querySelector('.copy-text');
      const status = button.parentElement.querySelector('[role="status"]');
      let timer = 0;

      button.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(button.dataset.copy);
        } catch {
          return;
        }
        button.classList.add('is-copied');
        label.textContent = 'Copied';
        if (status) status.textContent = 'Email address copied';
        clearTimeout(timer);
        timer = setTimeout(() => {
          button.classList.remove('is-copied');
          label.textContent = 'Copy';
          if (status) status.textContent = '';
        }, 2000);
      });
    });
  }

  // ---------------------------------------------------------------------------
  // Start
  // ---------------------------------------------------------------------------

  let started = false;

  function init() {
    syncGalleries();
    if (started) return;
    started = true;
    setupHeader();
    setupReveal();
    setupDialogs();
    setupGalleries();
    setupCopy();
  }

  init();

  // Restored from the back/forward cache: close anything modal and make sure
  // nothing is left waiting for a reveal. Running init again is harmless.
  window.addEventListener('pageshow', event => {
    init();
    if (!event.persisted) return;
    document.querySelectorAll('dialog[open]').forEach(dialog => dialog.close());
    revealAll();
  });
})();
