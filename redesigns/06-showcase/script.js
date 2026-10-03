(() => {
  // Tells the CSS that this file really runs: the gallery buttons show and the
  // reveal failsafe in styles.css stands down.
  document.documentElement.classList.add('js-ready');

  const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const readList = (el, name) =>
    (el.getAttribute(name) || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
  const readImages = btn => readList(btn, 'data-images');

  // --- Galleries synced from a folder by scripts/update-galleries.mjs ---
  // data-images can change between deploys, so the buttons and the Auto-Prep
  // frame are set up from it on every load.
  function syncGalleries() {
    document.querySelectorAll('.btn-gallery[data-gallery-dir]').forEach(btn => {
      const images = readImages(btn);
      btn.hidden = images.length === 0;
      // The badge shows the number; screen readers hear "Screenshots (10 images)".
      const count = btn.querySelector('[data-count]');
      const label = btn.querySelector('[data-count-label]');
      const n = images.length;
      if (count) count.textContent = n ? String(n) : '';
      if (label) label.textContent = n ? ` (${n} ${n === 1 ? 'image' : 'images'})` : '';
    });

    // A project without screenshots shows a drawing; once its folder has
    // images, the first one replaces the drawing inside a browser frame.
    document.querySelectorAll('[data-shot-of]').forEach(frame => {
      const dir = frame.getAttribute('data-shot-of');
      const btn = document.querySelector(`.btn-gallery[data-gallery-dir="${dir}"]`);
      const images = btn ? readImages(btn) : [];
      const figure = frame.closest('figure');
      const fallback = figure.querySelector('[data-shot-fallback]');
      const caption = figure.querySelector('[data-shot-caption]');
      const img = frame.querySelector('img');
      const hasShot = images.length > 0;

      if (hasShot && img.getAttribute('src') !== images[0]) img.src = images[0];
      frame.hidden = !hasShot;
      if (fallback) fallback.hidden = hasShot;
      if (caption) {
        if (!caption.dataset.fallbackText) caption.dataset.fallbackText = caption.textContent;
        caption.textContent = hasShot ? caption.dataset.shotCaption : caption.dataset.fallbackText;
      }
    });
  }

  // --- Request access dialog ---
  function bindAccessDialog() {
    document.querySelectorAll('[data-dialog]').forEach(btn => {
      const dialog = document.getElementById(btn.getAttribute('data-dialog'));
      if (!dialog) return;
      // The buttons are mailto links, so they still work without JavaScript.
      btn.addEventListener('click', event => {
        event.preventDefault();
        dialog.showModal();
        dialog.addEventListener('close', () => btn.focus(), { once: true });
      });
    });
  }

  // --- Lightbox ---
  function bindLightbox() {
    const box = document.getElementById('lightbox');
    if (!box) return;
    const img = box.querySelector('.lightbox__img');
    const title = box.querySelector('.lightbox__title');
    const counter = box.querySelector('.lightbox__counter');
    const status = box.querySelector('.lightbox__status');
    const closeBtn = box.querySelector('.lightbox__close');
    const prevBtn = box.querySelector('.lightbox__nav--prev');
    const nextBtn = box.querySelector('.lightbox__nav--next');
    const imageFile = /\.(png|jpe?g|gif|webp)$/i;
    const githubCache = new Map();

    const state = { images: [], index: 0, title: '', opener: null };

    const setState = (name, message = '') => {
      box.dataset.state = name;
      status.textContent = message;
    };

    function show(index) {
      const n = state.images.length;
      state.index = (index + n) % n;
      counter.textContent = `${state.index + 1} of ${n}`;
      img.alt = `${state.title}, image ${state.index + 1} of ${n}`;
      setState('loading', 'Loading…');
      img.src = state.images[state.index];
      if (img.complete && img.naturalWidth > 0) setState('ready');
      // Warm up the next image so the arrow keys feel instant.
      if (n > 1) new Image().src = state.images[(state.index + 1) % n];
    }

    img.addEventListener('load', () => setState('ready'));
    img.addEventListener('error', () => {
      if (img.getAttribute('src')) setState('error', 'This image could not be loaded.');
    });

    async function fromGitHub(repo, folder) {
      const key = `${repo}/${folder}`;
      if (githubCache.has(key)) return githubCache.get(key);
      const response = await fetch(`https://api.github.com/repos/${repo}/contents/${folder}`);
      if (!response.ok) throw new Error(`GitHub answered ${response.status}`);
      const files = await response.json();
      const images = files
        .filter(file => file.type === 'file' && imageFile.test(file.name))
        .map(file => file.download_url);
      githubCache.set(key, images);
      return images;
    }

    async function open(btn) {
      state.opener = btn;
      state.title = btn.getAttribute('data-title') || 'Screenshots';
      state.images = [];
      title.textContent = state.title;
      counter.textContent = '';
      img.removeAttribute('src');
      img.alt = '';
      delete box.dataset.many;
      setState('loading', 'Loading…');
      if (!box.open) box.showModal();
      closeBtn.focus();

      let images = [];
      try {
        if (btn.hasAttribute('data-gallery-dir')) {
          images = readImages(btn); // read at click time: the list changes between deploys
          // Hand-picked files open the gallery when the folder still has them;
          // the rest follow in folder order.
          const first = readList(btn, 'data-first').filter(src => images.includes(src));
          images = [...first, ...images.filter(src => !first.includes(src))];
        } else if (btn.hasAttribute('data-repo')) {
          images = await fromGitHub(btn.getAttribute('data-repo'), btn.getAttribute('data-folder') || 'screenshots');
        }
      } catch (err) {
        // The repository may be private or rate-limited: fall back to the
        // copies in assets/ when the button names some.
        console.warn(err);
        images = readList(btn, 'data-fallback');
        if (!images.length) {
          if (state.opener === btn) setState('error', 'Could not load the screenshots from GitHub.');
          return;
        }
      }
      if (state.opener !== btn || !box.open) return;
      if (images.length === 0) {
        setState('empty', 'No screenshots yet.');
        return;
      }
      state.images = images;
      if (images.length > 1) box.dataset.many = '';
      show(0);
    }

    document.querySelectorAll('.btn-gallery').forEach(btn => {
      btn.addEventListener('click', () => open(btn));
    });

    prevBtn.addEventListener('click', () => state.images.length && show(state.index - 1));
    nextBtn.addEventListener('click', () => state.images.length && show(state.index + 1));

    // Escape is handled here too, not only by the native dialog, so it works
    // the same in every browser and while an image is still loading.
    box.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        event.preventDefault();
        box.close();
        return;
      }
      if (!state.images.length) return;
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        show(state.index + 1);
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        show(state.index - 1);
      }
    });

    // A click on the dark area around the image closes, like any photo viewer.
    box.addEventListener('click', event => {
      if (event.target === box || event.target.classList.contains('lightbox__figure')) box.close();
    });

    box.addEventListener('close', () => {
      img.removeAttribute('src');
      state.images = [];
      if (state.opener) state.opener.focus();
    });
  }

  // --- Reveal on scroll ---
  function setupReveal() {
    const items = document.querySelectorAll('.reveal');
    if (reduceMotion() || !('IntersectionObserver' in window)) {
      items.forEach(el => el.classList.add('is-in'));
      return;
    }
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    });
    items.forEach(el => io.observe(el));
  }

  // --- Header line in the colour of the project on screen ---
  function setupSpy() {
    const header = document.querySelector('.site-header');
    if (!header || !('IntersectionObserver' in window)) return;
    const sections = document.querySelectorAll('main > section, .project');
    const io = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          const hue = [...entry.target.classList].find(name => name.startsWith('hue-'));
          if (hue) header.style.setProperty('--spy', `var(--${hue})`);
          else if (!entry.target.classList.contains('projects')) header.style.removeProperty('--spy');
        });
      },
      // A thin band across the middle of the screen decides which one is current.
      { rootMargin: '-45% 0px -54% 0px' }
    );
    sections.forEach(el => io.observe(el));
  }

  let bound = false;

  function setup() {
    syncGalleries();
    if (bound) return;
    bound = true;
    bindAccessDialog();
    bindLightbox();
    setupReveal();
    setupSpy();
  }

  // Set up as soon as the HTML is parsed, so the empty Auto-Prep button is
  // settled before the images finish loading.
  document.addEventListener('DOMContentLoaded', setup);

  // pageshow also fires on a back/forward-cache restore: close any dialog left
  // open, re-read the galleries and show every reveal. Running twice is harmless.
  window.addEventListener('pageshow', event => {
    setup();
    if (!event.persisted) return;
    document.querySelectorAll('dialog[open]').forEach(dialog => dialog.close());
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('is-in'));
  });
})();
