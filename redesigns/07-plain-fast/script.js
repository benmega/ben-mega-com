// Ben Mega: plain and fast. The page reads without this file. It adds the
// screenshot lightbox, the request-access dialog and the gallery counts.

(() => {
  'use strict';

  const lightbox = document.getElementById('lightbox');
  const access = document.getElementById('access');
  if (!lightbox || !access || typeof lightbox.showModal !== 'function') return;

  const box = {
    title: document.getElementById('lightbox-title'),
    count: document.getElementById('lightbox-count'),
    status: document.getElementById('lightbox-status'),
    img: document.getElementById('lightbox-img'),
    close: lightbox.querySelector('[data-close]'),
    nav: lightbox.querySelector('.lightbox-nav'),
  };

  const IMAGE_FILE = /\.(png|jpe?g|gif|webp|svg)$/i;
  const parseList = value =>
    String(value ?? '')
      .split(',')
      .map(item => item.trim())
      .filter(Boolean);

  // "assets/mega-chess/phone_screenshot_1.png" -> "phone screenshot 1"
  const describeFile = src => {
    const name = src.split('/').pop().replace(/\.[a-z0-9]+$/i, '');
    return decodeURIComponent(name).replace(/[-_]+/g, ' ');
  };
  const galleryName = title => title.replace(/\s*screenshots?$/i, '');

  // What the known gallery files show, for those that are not on the page.
  // Only descriptions: the list of files still comes from data-images, and a
  // file that is not named here is described by its file name.
  const DESCRIPTIONS = {
    'assets/mega-chess/phone_screenshot_3.png': 'Mega Chess screen for finding friends by player ID',
    'assets/mega-chess/tablet_screenshot_1.png': 'Mega Chess on a tablet: the list of active games',
    'assets/mega-chess/tablet_screenshot_2.png': 'Mega Chess on a tablet: a new game with a choice of board',
    'assets/mega-chess/tablet_screenshot_3.png': 'Mega Chess on a tablet: finding friends by player ID',
    'assets/mega-chess/tablet_screenshot_4.png': 'Mega Chess on a tablet: a Chinese chess board at the start of a game',
    'assets/mega-chess/tablet_screenshot_5.png': 'Mega Chess on a tablet: an international chess board at the start of a game',
  };

  let images = [];
  let index = 0;
  let opener = null;
  // Bumped on every open, step and close so a slow image cannot arrive late.
  let request = 0;

  function reset() {
    request++;
    images = [];
    box.img.removeAttribute('src');
    box.img.alt = '';
    box.count.textContent = '';
    box.status.textContent = '';
    box.nav.hidden = true;
    lightbox.classList.remove('is-busy');
  }

  function show(i) {
    index = (i + images.length) % images.length;
    const { src, alt } = images[index];
    const token = ++request;
    box.count.textContent = `${index + 1} of ${images.length}`;
    // Previous and Next only when there is somewhere to go.
    box.nav.hidden = images.length < 2;
    lightbox.classList.add('is-busy');
    // Cached images arrive at once; only say "Loading" when it takes a moment.
    setTimeout(() => {
      if (token === request && lightbox.classList.contains('is-busy')) box.status.textContent = 'Loading…';
    }, 200);

    const probe = new Image();
    probe.onload = () => {
      if (token !== request) return;
      box.img.src = src;
      box.img.alt = alt;
      box.status.textContent = '';
      lightbox.classList.remove('is-busy');
    };
    probe.onerror = () => {
      if (token !== request) return;
      box.img.removeAttribute('src');
      box.img.alt = '';
      box.status.textContent = 'This screenshot could not be loaded.';
      lightbox.classList.remove('is-busy');
    };
    probe.src = src;
  }

  function fill(list, start = 0) {
    if (list.length === 0) {
      box.status.textContent = 'No screenshots yet.';
      return;
    }
    images = list;
    show(start);
  }

  function openLightbox(title, from) {
    opener = from;
    reset();
    box.title.textContent = title;
    if (!lightbox.open) lightbox.showModal();
    box.close.focus();
  }

  // The pictures placed on the page have written alt text; a gallery reuses
  // it for the same file, then looks for a description, then uses the name.
  const altFor = (src, name) => {
    const shot = Array.from(document.querySelectorAll('a.shot')).find(link => link.getAttribute('href') === src);
    const img = shot && shot.querySelector('img');
    if (img && img.alt) return img.alt;
    return DESCRIPTIONS[src] || `${name}: ${describeFile(src)}`;
  };
  const shotsIn = (scope, name) =>
    Array.from(scope.querySelectorAll('a.shot'), link => {
      const src = link.getAttribute('href');
      return { src, alt: altFor(src, name) };
    });

  // The gallery button: data-images is read now, not at load, because a
  // script rewrites it between deploys. Without a local list the images come
  // from a folder of a public GitHub repository; if that fails, the pictures
  // already on the page are shown instead of an error.
  async function openGallery(button, start = 0, from = button) {
    const title = button.dataset.title || 'Screenshots';
    const name = galleryName(title);
    openLightbox(title, from);

    if (button.hasAttribute('data-images')) {
      fill(parseList(button.dataset.images).map(src => ({ src, alt: altFor(src, name) })), start);
      return;
    }

    const token = request;
    const onPage = shotsIn(button.closest('article'), name);
    box.status.textContent = 'Loading…';
    try {
      const folder = button.dataset.folder || 'screenshots';
      const response = await fetch(`https://api.github.com/repos/${button.dataset.repo}/contents/${folder}`);
      if (!response.ok) throw new Error(response.statusText);
      const files = await response.json();
      if (token !== request) return;
      const list = files
        .filter(file => file.type === 'file' && IMAGE_FILE.test(file.name))
        .map(file => ({ src: file.download_url, alt: `${name}: ${describeFile(file.name)}` }));
      fill(list.length ? list : onPage);
    } catch {
      if (token !== request) return;
      if (onPage.length) fill(onPage);
      else box.status.textContent = 'The screenshots could not be loaded from GitHub.';
    }
  }

  // A screenshot on the page opens its project's gallery at that picture.
  // When the gallery list does not hold it (Fractal Defense, whose list is on
  // GitHub), it browses the pictures on the page instead.
  function openShot(link) {
    const article = link.closest('article');
    const button = article.querySelector('.btn-gallery');
    const list = parseList(button.dataset.images);
    const src = link.getAttribute('href');
    if (list.includes(src)) {
      openGallery(button, list.indexOf(src), link);
      return;
    }
    const title = button.dataset.title || 'Screenshots';
    const shots = Array.from(article.querySelectorAll('a.shot'));
    openLightbox(title, link);
    fill(shotsIn(article, galleryName(title)), shots.indexOf(link));
  }

  function openAccess(from) {
    opener = from;
    if (!access.open) access.showModal();
  }

  // Galleries with a folder: hide the button while the folder is empty, show
  // the count when it is not, and put the first pictures on the page in place
  // of the drawing that stands in for them.
  function syncGalleries() {
    for (const button of document.querySelectorAll('.btn-gallery[data-gallery-dir]')) {
      const list = parseList(button.dataset.images);
      const name = galleryName(button.dataset.title || 'Screenshots');
      button.hidden = list.length === 0;
      const count = button.querySelector('.count');
      if (count) count.textContent = list.length ? ` (${list.length})` : '';

      const article = button.closest('article');
      const preview = article && article.querySelector('[data-preview]');
      if (!preview) continue;
      const strip = preview.querySelector('.shots');
      strip.replaceChildren(
        ...list.slice(0, 2).map(src => {
          const link = document.createElement('a');
          link.className = 'shot';
          link.href = src;
          const img = document.createElement('img');
          img.loading = 'lazy';
          img.decoding = 'async';
          img.alt = DESCRIPTIONS[src] || `${name}: ${describeFile(src)}`;
          img.src = src;
          link.append(img);
          return link;
        })
      );
      preview.hidden = list.length === 0;
      const standIn = article.querySelector('[data-preview-empty]');
      if (standIn) standIn.hidden = list.length > 0;
    }
  }

  const plainClick = event => !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey && event.button === 0;

  document.addEventListener('click', event => {
    if (!(event.target instanceof Element)) return;
    const control = event.target.closest('a.shot, .btn-gallery, [data-dialog], [data-close], [data-step]');
    if (!control) return;

    if (control.matches('.btn-gallery')) {
      openGallery(control);
    } else if (control.matches('[data-step]')) {
      if (images.length) show(index + Number(control.dataset.step));
    } else if (control.matches('[data-close]')) {
      control.closest('dialog').close();
    } else if (plainClick(event)) {
      event.preventDefault();
      if (control.matches('a.shot')) openShot(control);
      else openAccess(control);
    }
  });

  // The native dialog closes on Escape too; handling it here makes that
  // explicit and also covers the empty and failure states.
  lightbox.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      event.preventDefault();
      lightbox.close();
      return;
    }
    if (!images.length) return;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') show(index + 1);
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') show(index - 1);
    else if (event.key === 'Home') show(0);
    else if (event.key === 'End') show(images.length - 1);
    else return;
    event.preventDefault();
  });

  // The stage around the picture, and the backdrop of the small dialog, close.
  lightbox.querySelector('.lightbox-stage').addEventListener('click', event => {
    if (event.target !== box.img) lightbox.close();
  });
  access.addEventListener('click', event => {
    if (event.target !== access) return;
    const r = access.getBoundingClientRect();
    const inside =
      event.clientX >= r.left && event.clientX <= r.right && event.clientY >= r.top && event.clientY <= r.bottom;
    if (!inside) access.close();
  });

  const restoreFocus = () => {
    if (opener && opener.isConnected && !opener.hidden) opener.focus();
    opener = null;
  };
  lightbox.addEventListener('close', () => {
    // The close event arrives a moment later; the box may be open again by then.
    if (lightbox.open) return;
    reset();
    restoreFocus();
  });
  access.addEventListener('close', restoreFocus);

  // Without this script these links write an email; with it they open the dialog.
  for (const link of document.querySelectorAll('[data-dialog]')) link.setAttribute('aria-haspopup', 'dialog');
  syncGalleries();

  // Also runs when the page comes back from the back/forward cache: a dialog
  // that was open when the visitor left is closed again.
  window.addEventListener('pageshow', event => {
    if (!event.persisted) return;
    if (lightbox.open) lightbox.close();
    if (access.open) access.close();
    syncGalleries();
  });
})();
