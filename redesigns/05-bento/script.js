// Ben Mega — portfolio behaviour.
// Everything runs from `pageshow`, so a page restored from the back/forward
// cache is set up again. Listeners are attached once; the rest is idempotent.

(() => {
  const IMAGE_FILE = /\.(png|jpe?g|gif|webp)$/i;
  let wired = false;
  let revealObserver = null;

  /* ---------------------------------------------------------- entrance */

  // Tiles fade up as they enter the viewport. The hiding class goes on only
  // here, so without JavaScript (or with reduced motion) nothing is hidden.
  function setUpReveal(restored) {
    const tiles = document.querySelectorAll('.tile');
    const root = document.documentElement;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (revealObserver) revealObserver.disconnect();

    if (restored || reduced || !('IntersectionObserver' in window)) {
      tiles.forEach(tile => tile.classList.add('is-in'));
      return;
    }

    revealObserver = new IntersectionObserver(entries => {
      const entering = entries.filter(entry => entry.isIntersecting);
      entering.forEach((entry, i) => {
        entry.target.style.setProperty('--delay', `${Math.min(i, 3) * 40}ms`);
        entry.target.classList.add('is-in');
        revealObserver.unobserve(entry.target);
      });
    });
    tiles.forEach(tile => {
      if (!tile.classList.contains('is-in')) revealObserver.observe(tile);
    });
    root.classList.add('reveal-ready');
  }

  /* ---------------------------------------------------- gallery buttons */

  const listFrom = (button, attribute = 'data-images') =>
    (button.getAttribute(attribute) || '')
      .split(',')
      .map(item => item.trim())
      .filter(Boolean);

  // A folder-backed gallery with no images yet hides its button (Auto-Prep
  // today). The list is read again on every click, never cached.
  function syncGalleryButtons() {
    document.querySelectorAll('.btn-gallery[data-gallery-dir]').forEach(button => {
      button.hidden = listFrom(button).length === 0;
    });
    // The pictures on a project tile open the same gallery as its button.
    document.querySelectorAll('.t-project').forEach(tile => {
      const button = tile.querySelector('.btn-gallery');
      const picture = tile.querySelector('.t-media');
      if (picture) picture.classList.toggle('is-clickable', Boolean(button && !button.hidden));
    });
  }

  /* ------------------------------------------------------------ lightbox */

  const lightbox = document.getElementById('lightbox');
  const lb = lightbox && {
    title: lightbox.querySelector('.lb-title'),
    counter: lightbox.querySelector('.lb-counter'),
    img: lightbox.querySelector('.lb-img'),
    status: lightbox.querySelector('.lb-status'),
    prev: lightbox.querySelector('.lb-prev'),
    next: lightbox.querySelector('.lb-next'),
    repo: lightbox.querySelector('.lb-repo'),
  };
  const gallery = { images: [], index: 0, name: '', request: 0, opener: null };

  function setGalleryState(state, message = '') {
    lightbox.classList.toggle('is-loading', state === 'loading');
    lightbox.classList.toggle('is-failed', state === 'failed');
    // Nothing to page through: the box shrinks to fit the message.
    lightbox.classList.toggle('is-empty', state === 'failed' && !gallery.images.length);
    lb.status.textContent = message;
    if (state !== 'failed') lb.repo.hidden = true;
  }

  function showImage(index) {
    const { images } = gallery;
    if (!images.length) return;
    gallery.index = (index + images.length) % images.length;
    const n = gallery.index + 1;
    const request = ++gallery.request;

    lb.counter.textContent = `${n} / ${images.length}`;
    lb.img.alt = `${gallery.name} screenshot ${n} of ${images.length}`;
    setGalleryState('loading', 'Loading…');

    lb.img.onload = () => {
      if (request === gallery.request) setGalleryState('ready');
    };
    lb.img.onerror = () => {
      if (request === gallery.request) setGalleryState('failed', 'This screenshot could not be loaded.');
    };
    lb.img.src = images[gallery.index];

    // Warm the cache for the next one, so arrowing through feels instant.
    if (images.length > 1) new Image().src = images[(gallery.index + 1) % images.length];
  }

  function setImages(images) {
    gallery.images = images;
    const several = images.length > 1;
    lb.prev.hidden = !several;
    lb.next.hidden = !several;
    if (images.length) showImage(0);
  }

  async function openGallery(button) {
    const title = button.getAttribute('data-title') || 'Screenshots';
    const repo = button.getAttribute('data-repo');
    const folder = button.getAttribute('data-folder') || 'screenshots';

    gallery.opener = button;
    gallery.name = title.replace(/\s*screenshots$/i, '');
    gallery.request++;
    lb.title.textContent = title;
    lb.counter.textContent = '';
    lb.img.removeAttribute('src');
    lb.img.alt = '';
    setImages([]);
    if (!lightbox.open) lightbox.showModal();

    const local = listFrom(button);
    if (local.length) {
      setImages(local);
      return;
    }
    if (!repo) {
      setGalleryState('failed', 'No screenshots yet.');
      return;
    }

    // Fractal Defense: the images are listed from its GitHub repository. If
    // that fails, the copies in data-fallback-images are shown instead.
    const request = gallery.request;
    setGalleryState('loading', 'Loading screenshots…');
    try {
      const response = await fetch(`https://api.github.com/repos/${repo}/contents/${folder}`);
      if (!response.ok) throw new Error(`GitHub answered ${response.status}`);
      const files = await response.json();
      const images = files
        .filter(file => file.type === 'file' && IMAGE_FILE.test(file.name))
        .map(file => file.download_url);
      if (request !== gallery.request) return;
      if (!images.length) throw new Error('No images in the folder');
      setImages(images);
    } catch {
      if (request !== gallery.request) return;
      const fallback = listFrom(button, 'data-fallback-images');
      if (fallback.length) setImages(fallback);
      else {
        setGalleryState('failed', 'The screenshots could not be loaded right now.');
        lb.repo.href = `https://github.com/${repo}`;
        lb.repo.hidden = false;
      }
    }
  }

  /* -------------------------------------------------------------- dialogs */

  const access = document.getElementById('access');
  let accessOpener = null;

  function openAccess(button) {
    accessOpener = button;
    const kicker = access.querySelector('.modal-kicker');
    const project = button.getAttribute('data-project');
    kicker.textContent = project ? `${project} · Private repository` : 'Private repository';
    access.showModal();
  }

  // Close when the backdrop is clicked; a click inside the box keeps it open.
  function closeOnBackdrop(dialog) {
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const box = dialog.getBoundingClientRect();
      const inside =
        event.clientX >= box.left && event.clientX <= box.right &&
        event.clientY >= box.top && event.clientY <= box.bottom;
      if (!inside) dialog.close();
    });
  }

  /* -------------------------------------------------------------- wiring */

  function wire() {
    document.querySelectorAll('.btn-gallery').forEach(button => {
      button.addEventListener('click', () => openGallery(button));
    });

    document.querySelectorAll('.t-project .t-media').forEach(picture => {
      picture.addEventListener('click', () => {
        const button = picture.closest('.t-project').querySelector('.btn-gallery');
        if (button && !button.hidden) openGallery(button);
      });
    });

    document.querySelectorAll('.btn-access').forEach(button => {
      button.addEventListener('click', () => openAccess(button));
    });

    document.querySelectorAll('dialog [data-close]').forEach(button => {
      button.addEventListener('click', () => button.closest('dialog').close());
    });

    if (access) {
      closeOnBackdrop(access);
      access.addEventListener('close', () => {
        if (accessOpener) accessOpener.focus();
        accessOpener = null;
      });
    }

    if (lightbox) {
      closeOnBackdrop(lightbox);
      lb.prev.addEventListener('click', () => showImage(gallery.index - 1));
      lb.next.addEventListener('click', () => showImage(gallery.index + 1));

      lightbox.addEventListener('keydown', event => {
        if (gallery.images.length < 2) return;
        if (event.key === 'ArrowLeft') showImage(gallery.index - 1);
        else if (event.key === 'ArrowRight') showImage(gallery.index + 1);
        else return;
        event.preventDefault();
      });

      // Swipe on touch screens.
      let touchX = null;
      lightbox.addEventListener('touchstart', event => {
        touchX = event.touches.length === 1 ? event.touches[0].clientX : null;
      }, { passive: true });
      lightbox.addEventListener('touchend', event => {
        if (touchX === null || gallery.images.length < 2) return;
        const dx = event.changedTouches[0].clientX - touchX;
        if (Math.abs(dx) > 48) showImage(gallery.index + (dx < 0 ? 1 : -1));
        touchX = null;
      });

      lightbox.addEventListener('close', () => {
        gallery.request++;
        gallery.images = [];
        lb.img.removeAttribute('src');
        if (gallery.opener) gallery.opener.focus();
        gallery.opener = null;
      });
    }
  }

  window.addEventListener('pageshow', event => {
    if (!wired) {
      wire();
      wired = true;
    }
    syncGalleryButtons();
    setUpReveal(event.persisted);
  });
})();
