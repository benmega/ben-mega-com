// This file loads in the head. It marks JavaScript as on and applies a saved
// theme before anything paints, then sets up the page once the document is
// parsed, and again when it is restored from the back/forward cache. Every
// step is safe to repeat.
document.documentElement.classList.replace('no-js', 'js');

const THEME_KEY = 'theme';
const THEME_COLORS = { light: '#f7f3ea', dark: '#1c2a24' };
const IMAGE_FILE = /\.(png|jpe?g|gif|webp|svg)$/i;

const prefersDark = () => matchMedia('(prefers-color-scheme: dark)').matches;
const prefersReducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** The theme in effect: the visitor's choice, or the system setting. */
function currentTheme() {
  const chosen = document.documentElement.dataset.theme;
  if (chosen === 'light' || chosen === 'dark') return chosen;
  return prefersDark() ? 'dark' : 'light';
}

function applyTheme(theme) {
  const root = document.documentElement;
  if (theme) root.dataset.theme = theme;
  else delete root.dataset.theme;

  const active = currentTheme();
  const toggle = document.querySelector('.theme-toggle');
  if (toggle) {
    toggle.setAttribute(
      'aria-label',
      active === 'dark' ? 'Switch to the paper theme' : 'Switch to the chalkboard theme'
    );
  }
  for (const meta of document.querySelectorAll('meta[name="theme-color"]')) {
    // With a choice made, both metas carry the chosen colour, whatever their media query.
    meta.content = theme ? THEME_COLORS[active] : THEME_COLORS[meta.media.includes('dark') ? 'dark' : 'light'];
  }
}

function storedTheme() {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    return stored === 'light' || stored === 'dark' ? stored : null;
  } catch {
    // Storage may be unavailable; the system setting is used.
    return null;
  }
}

function setupTheme() {
  applyTheme(storedTheme());

  const toggle = document.querySelector('.theme-toggle');
  if (!toggle || toggle.dataset.ready) return;
  toggle.dataset.ready = 'true';
  toggle.addEventListener('click', () => {
    const next = currentTheme() === 'dark' ? 'light' : 'dark';
    // Choosing the system's own theme clears the override instead of pinning it.
    const override = next === (prefersDark() ? 'dark' : 'light') ? null : next;
    applyTheme(override);
    try {
      if (override) localStorage.setItem(THEME_KEY, override);
      else localStorage.removeItem(THEME_KEY);
    } catch {
      // Not stored; the choice still holds for this page.
    }
  });
}

function setupReveal() {
  const items = document.querySelectorAll('.reveal');
  if (!items.length) return;

  if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
    for (const el of items) el.classList.add('is-in');
    return;
  }

  const observer = new IntersectionObserver(
    (entries, obs) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-in');
        obs.unobserve(entry.target);
      }
    },
    // Anything that touches the screen is shown at once, so nothing on screen stays hidden
    { threshold: 0 }
  );
  for (const el of items) {
    if (el.classList.contains('is-in')) continue;
    observer.observe(el);
  }
}

/** Splits a data-images value into paths. */
const parseImages = value =>
  String(value ?? '')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);

/**
 * A gallery whose folder has no images yet is hidden; otherwise its button
 * shows how many there are. The list itself is only read when it is clicked,
 * because scripts/update-galleries.mjs rewrites it between deploys.
 */
function setupGalleryButtons() {
  for (const btn of document.querySelectorAll('.btn-gallery[data-gallery-dir]')) {
    const count = parseImages(btn.getAttribute('data-images')).length;
    btn.hidden = count === 0;
    const label = btn.querySelector('.count');
    if (label) label.textContent = count ? `(${count})` : '';
  }
}

/** Lists the images in a folder of a public GitHub repository. */
async function fetchRepoImages(repo, folder) {
  const response = await fetch(`https://api.github.com/repos/${repo}/contents/${folder}`);
  if (!response.ok) throw new Error(`GitHub answered ${response.status}`);
  const files = await response.json();
  return files
    .filter(file => file.type === 'file' && IMAGE_FILE.test(file.name))
    .map(file => file.download_url);
}

/**
 * Escape closes a dialog. Browsers do this natively, but not all of them do it
 * reliably (close watchers ignore repeated presses), so it is handled here too.
 */
function closeOnEscape(dialog) {
  dialog.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || !dialog.open) return;
    event.preventDefault();
    dialog.close();
  });
}

/** A readable name for a screenshot file: "phone_screenshot_3.png" becomes "phone screenshot 3". */
function imageName(src) {
  const file = String(src).split(/[?#]/)[0].split('/').pop() || '';
  let name = file;
  try {
    name = decodeURIComponent(file);
  } catch {
    // Keep the raw file name
  }
  return name.replace(/\.[a-z0-9]+$/i, '').replace(/[_-]+/g, ' ').trim();
}

function setupAccessDialog() {
  for (const btn of document.querySelectorAll('[data-open-dialog]')) {
    if (btn.dataset.ready) continue;
    btn.dataset.ready = 'true';
    btn.addEventListener('click', () => {
      const dialog = document.getElementById(btn.dataset.openDialog);
      if (dialog && typeof dialog.showModal === 'function' && !dialog.open) dialog.showModal();
    });
  }
  for (const dialog of document.querySelectorAll('dialog.dialog')) {
    if (dialog.dataset.ready) continue;
    dialog.dataset.ready = 'true';
    // A click on the backdrop closes the dialog
    dialog.addEventListener('click', event => {
      if (event.target === dialog) dialog.close();
    });
    closeOnEscape(dialog);
  }
}

function setupLightbox() {
  const dialog = document.getElementById('lightbox');
  if (!dialog || dialog.dataset.ready || typeof dialog.showModal !== 'function') return;
  dialog.dataset.ready = 'true';

  const img = document.getElementById('lightbox-img');
  const title = document.getElementById('lightbox-title');
  const counter = document.getElementById('lightbox-counter');
  const status = document.getElementById('lightbox-status');
  const prev = document.getElementById('lightbox-prev');
  const next = document.getElementById('lightbox-next');
  const close = document.getElementById('lightbox-close');

  let images = [];
  let index = 0;
  let opener = null;
  let request = 0;

  const setStatus = text => {
    status.textContent = text;
  };

  const show = i => {
    if (!images.length) return;
    index = (i + images.length) % images.length;
    const token = ++request;
    const src = images[index];
    counter.textContent = `${index + 1} of ${images.length}`;
    img.hidden = true;
    const name = imageName(src);
    img.alt = `${title.textContent}, ${index + 1} of ${images.length}${name ? `: ${name}` : ''}`;
    setStatus('Loading…');

    const loader = new Image();
    loader.onload = () => {
      if (token !== request) return;
      img.src = src;
      img.hidden = false;
      setStatus('');
      // The neighbours are fetched early so the arrows feel instant
      for (const near of [images[(index + 1) % images.length], images[(index - 1 + images.length) % images.length]]) {
        if (near !== src) new Image().src = near;
      }
    };
    loader.onerror = () => {
      if (token !== request) return;
      setStatus('This screenshot could not be loaded.');
    };
    loader.src = src;
  };

  const setNav = enabled => {
    prev.disabled = !enabled;
    next.disabled = !enabled;
  };

  const open = async (btn, byPointer) => {
    opener = btn;
    images = [];
    request++;
    img.hidden = true;
    img.removeAttribute('src');
    img.alt = '';
    title.textContent = btn.getAttribute('data-title') || 'Screenshots';
    counter.textContent = '';
    setNav(false);
    setStatus('Loading…');
    if (!dialog.open) dialog.showModal();
    // Focus moves in either way; the ring is drawn only for keyboard users
    close.focus(byPointer ? { focusVisible: false } : undefined);

    const repo = btn.getAttribute('data-repo');
    let failed = false;
    if (btn.hasAttribute('data-gallery-dir')) {
      images = parseImages(btn.getAttribute('data-images'));
    } else if (repo) {
      try {
        images = await fetchRepoImages(repo, btn.getAttribute('data-folder') || 'screenshots');
      } catch {
        failed = true;
      }
      // The copies in the site's own assets stand in when GitHub has none to give
      if (!images.length) images = parseImages(btn.getAttribute('data-fallback'));
    }
    if (opener !== btn || !dialog.open) return;
    if (!images.length) {
      setStatus(failed ? 'The screenshots could not be loaded. Please try again later.' : 'No screenshots yet.');
      return;
    }
    setNav(images.length > 1);
    show(0);
  };

  for (const btn of document.querySelectorAll('.btn-gallery')) {
    // A mouse or tap click has a detail count; Enter and Space do not
    btn.addEventListener('click', event => open(btn, event.detail > 0));
  }

  prev.addEventListener('click', () => show(index - 1));
  next.addEventListener('click', () => show(index + 1));
  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    // Only the empty area around the picture closes it
    if (event.target === dialog || event.target.classList.contains('lightbox-stage')) dialog.close();
  });
  closeOnEscape(dialog);
  dialog.addEventListener('keydown', event => {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      show(index + 1);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      show(index - 1);
    }
  });
  dialog.addEventListener('close', () => {
    request++;
    images = [];
    img.removeAttribute('src');
    img.hidden = true;
    setStatus('');
    if (opener && opener.isConnected) opener.focus();
    opener = null;
  });
}

function setup() {
  setupTheme();
  setupGalleryButtons();
  setupAccessDialog();
  setupLightbox();
  setupReveal();
}

applyTheme(storedTheme());
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup);
else setup();
window.addEventListener('pageshow', event => {
  if (event.persisted) setup();
});
