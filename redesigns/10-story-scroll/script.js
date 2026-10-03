(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  /** Splits a comma separated attribute into trimmed, non-empty items. */
  const parseList = value =>
    String(value || '')
      .split(',')
      .map(item => item.trim())
      .filter(Boolean);

  /** The file name at the end of a path or URL, for matching across both. */
  const fileName = url => decodeURIComponent(String(url).split(/[?#]/)[0].split('/').pop());

  /** The alt text of an image on the page that shows the same file, if there is one. */
  const pageAltFor = src => {
    const name = fileName(src);
    const match = $$('main img[alt]').find(
      img => img.alt && fileName(img.getAttribute('src')) === name
    );
    return match ? match.alt : '';
  };

  // ---------------------------------------------------------------------------
  // Chapter rail: which chapter the reader is in, and how far into it
  // ---------------------------------------------------------------------------
  const rail = (() => {
    const chapters = [];
    for (const section of $$('[data-chapter][id]')) {
      const link = $(`.chapters__link[href="#${section.id}"]`);
      if (!link) continue;
      const parts = $$('.chapters__section', link.parentElement)
        .map(sub => ({ sub, target: document.getElementById(sub.hash.slice(1)) }))
        .filter(part => part.target);
      chapters.push({ section, link, item: link.parentElement, parts });
    }
    if (!chapters.length) return { update() {} };

    let queued = false;

    function update() {
      queued = false;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const atEnd = window.scrollY >= maxScroll - 2;
      // The reading line: a chapter counts as current once its top passes it.
      const line = window.innerHeight * 0.4;
      let current = null;

      for (const chapter of chapters) {
        const box = chapter.section.getBoundingClientRect();
        const progress = atEnd ? 1 : Math.min(1, Math.max(0, (line - box.top) / (box.height || 1)));
        chapter.item.style.setProperty('--p', progress.toFixed(3));
        if (box.top <= line) current = chapter;
      }
      if (atEnd) current = chapters[chapters.length - 1];

      for (const chapter of chapters) {
        const isCurrent = chapter === current;
        if (isCurrent) chapter.link.setAttribute('aria-current', 'location');
        else chapter.link.removeAttribute('aria-current');
        // Projects that cross the reading line; Local Chat and Fractal Defense
        // sit side by side, so both can be current at once.
        for (const { sub, target } of chapter.parts) {
          const box = target.getBoundingClientRect();
          if (isCurrent && box.top <= line && box.bottom > line) sub.setAttribute('aria-current', 'true');
          else sub.removeAttribute('aria-current');
        }
      }
    }

    function schedule() {
      if (queued) return;
      queued = true;
      requestAnimationFrame(update);
    }

    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    // Lazy images and web fonts change the page height after load.
    if ('ResizeObserver' in window) new ResizeObserver(schedule).observe(document.body);

    return { update };
  })();

  // ---------------------------------------------------------------------------
  // Lightbox
  // ---------------------------------------------------------------------------
  const lightbox = (() => {
    const dialog = $('#lightbox');
    if (!dialog) return null;

    const image = $('#lightbox-image', dialog);
    const title = $('#lightbox-title', dialog);
    const counter = $('#lightbox-counter', dialog);
    const status = $('#lightbox-status', dialog);
    const message = $('#lightbox-message', dialog);
    const repoLink = $('#lightbox-repo', dialog);
    const dismiss = $('#lightbox-dismiss', dialog);
    const prev = $('#lightbox-prev', dialog);
    const next = $('#lightbox-next', dialog);
    const close = $('#lightbox-close', dialog);

    let images = [];
    let index = 0;
    let label = 'Screenshots';
    let repo = '';
    let opener = null;

    /**
     * state: '' (the image shows), 'loading', 'broken' (one image failed),
     * 'empty' or 'error' (nothing to show, so offer a way on).
     */
    function setStatus(state, text = '') {
      status.dataset.state = state;
      message.textContent = text;
      repoLink.hidden = !(state === 'error' && repo);
      if (repo) repoLink.href = `https://github.com/${repo}`;
      dismiss.hidden = !(state === 'empty' || state === 'error') || !repoLink.hidden;
    }

    function show(i) {
      if (!images.length) return;
      index = (i + images.length) % images.length;
      counter.textContent = `${index + 1} of ${images.length}`;
      image.hidden = true;
      image.alt = pageAltFor(images[index]) || `${label}, ${index + 1} of ${images.length}`;
      setStatus('loading', 'Loading…');
      image.src = images[index];
      // Warm the cache for the next one.
      if (images.length > 1) new Image().src = images[(index + 1) % images.length];
    }

    image.addEventListener('load', () => {
      image.hidden = false;
      setStatus('');
    });
    image.addEventListener('error', () => {
      image.hidden = true;
      setStatus('broken', 'This screenshot could not be loaded.');
    });

    function setList(list, start) {
      images = list;
      const many = images.length > 1;
      prev.disabled = !many;
      next.disabled = !many;
      counter.textContent = '';
      if (images.length) show(start(images));
      else {
        image.hidden = true;
        image.removeAttribute('src');
        setStatus('empty', 'No screenshots yet.');
      }
    }

    /**
     * Opens the gallery of `button`. `list` may be a promise while it loads;
     * `start` picks the first image from the resolved list. Focus returns to
     * `trigger`.
     */
    function open(trigger, button, list, start = () => 0) {
      opener = trigger;
      label = button.dataset.title || 'Screenshots';
      repo = button.dataset.repo || '';
      title.textContent = label;
      images = [];
      image.hidden = true;
      image.removeAttribute('src');
      counter.textContent = '';
      prev.disabled = true;
      next.disabled = true;
      setStatus('loading', 'Loading…');
      if (!dialog.open) dialog.showModal();
      close.focus();

      // A local list shows at once; only the GitHub list has to be waited for.
      if (Array.isArray(list)) {
        setList(list, start);
        return;
      }
      Promise.resolve(list).then(
        resolved => {
          if (!dialog.open || opener !== trigger) return;
          setList(resolved, start);
        },
        () => {
          if (!dialog.open || opener !== trigger) return;
          setStatus('error', 'The screenshots could not be loaded.');
        }
      );
    }

    prev.addEventListener('click', () => show(index - 1));
    next.addEventListener('click', () => show(index + 1));
    close.addEventListener('click', () => dialog.close());
    dismiss.addEventListener('click', () => dialog.close());

    dialog.addEventListener('keydown', event => {
      if (!images.length) return;
      if (event.key === 'ArrowRight') show(index + 1);
      else if (event.key === 'ArrowLeft') show(index - 1);
      else if (event.key === 'Home') show(0);
      else if (event.key === 'End') show(images.length - 1);
      else return;
      event.preventDefault();
    });

    // The lightbox covers the screen: a click on the dark space around the
    // image closes it, a click on the image or a control does not.
    dialog.addEventListener('click', event => {
      if (event.target.matches('.lightbox, .lightbox__stage, .lightbox__frame')) dialog.close();
    });

    dialog.addEventListener('close', () => {
      image.hidden = true;
      image.removeAttribute('src');
      setStatus('');
      images = [];
      if (opener && opener.isConnected) opener.focus();
      opener = null;
    });

    return { open };
  })();

  // ---------------------------------------------------------------------------
  // Galleries
  // ---------------------------------------------------------------------------
  const IMAGE_FILE = /\.(png|jpe?g|gif|webp|svg)$/i;
  const githubCache = new Map();

  /** The image files of a folder in a public GitHub repository. */
  function fetchGithubImages(repo, folder) {
    const key = `${repo}/${folder}`;
    if (!githubCache.has(key)) {
      const request = fetch(`https://api.github.com/repos/${repo}/contents/${folder}`)
        .then(response => {
          if (!response.ok) throw new Error(`GitHub answered ${response.status}`);
          return response.json();
        })
        .then(files =>
          files
            .filter(file => file.type === 'file' && IMAGE_FILE.test(file.name))
            .map(file => file.download_url)
        );
      // A failed request is not kept, so the next click tries again.
      request.catch(() => githubCache.delete(key));
      githubCache.set(key, request);
    }
    return githubCache.get(key);
  }

  /** The images of a gallery button, read at the moment of the call. */
  function imagesOf(button) {
    if (button.hasAttribute('data-images') || button.hasAttribute('data-gallery-dir')) {
      return parseList(button.getAttribute('data-images'));
    }
    if (button.dataset.repo) {
      // data-fallback: hand-picked local copies, used when GitHub cannot answer
      // (rate limit, offline, folder missing).
      const fallback = parseList(button.dataset.fallback);
      return fetchGithubImages(button.dataset.repo, button.dataset.folder || 'screenshots').then(
        list => (list.length ? list : fallback),
        error => {
          if (fallback.length) return fallback;
          throw error;
        }
      );
    }
    return [];
  }

  /**
   * A gallery that is filled from a folder is hidden while the folder is empty
   * (scripts/update-galleries.mjs writes the list into data-images). Filmstrips
   * that mirror such a gallery are built here from the same list.
   */
  function syncGalleries() {
    for (const button of $$('.btn-gallery[data-gallery-dir]')) {
      const list = parseList(button.getAttribute('data-images'));
      button.hidden = list.length === 0;
    }
    for (const strip of $$('[data-filmstrip]')) {
      const button = document.getElementById(strip.dataset.filmstrip);
      const list = button ? parseList(button.getAttribute('data-images')) : [];
      const name = (button && button.dataset.title) || 'Screenshots';
      // A preview: one large image, then up to two more. The last one says how
      // many more the Screenshots button holds.
      const shown = list.slice(0, 3);
      const rest = list.length - shown.length;
      strip.replaceChildren(
        ...shown.map((src, i) => {
          const link = document.createElement('a');
          link.className = 'shot';
          link.href = src;
          link.dataset.gallery = button.id;
          const img = document.createElement('img');
          img.src = src;
          img.alt = `${name.replace(/ Screenshots$/i, '')} screenshot ${i + 1}`;
          img.loading = 'lazy';
          img.decoding = 'async';
          link.append(img);
          if (rest > 0 && i === shown.length - 1) {
            const more = document.createElement('span');
            more.className = 'filmstrip__more';
            more.textContent = `+${rest} more`;
            link.append(more);
          }
          return link;
        })
      );
      strip.dataset.count = String(shown.length);
      strip.hidden = list.length === 0;
    }
  }

  function setupGalleries() {
    if (!lightbox) return;
    for (const button of $$('.btn-gallery')) {
      button.addEventListener('click', () => {
        lightbox.open(button, button, imagesOf(button));
      });
    }

    // Shortcuts elsewhere on the page (the featured list) open a gallery too.
    for (const shortcut of $$('[data-gallery-for]')) {
      shortcut.addEventListener('click', () => {
        const button = document.getElementById(shortcut.dataset.galleryFor);
        if (button) lightbox.open(shortcut, button, imagesOf(button));
      });
    }

    // Screenshots on the page open the same gallery at that image. Without
    // JavaScript they are plain links to the image file.
    document.addEventListener('click', event => {
      const link = event.target.closest('a.shot[data-gallery]');
      if (!link || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const button = document.getElementById(link.dataset.gallery);
      if (!button) return;
      const list = imagesOf(button);
      // An empty folder list: let the link open the image it points to.
      if (Array.isArray(list) && !list.length) return;
      const name = fileName(link.getAttribute('href'));
      event.preventDefault();
      lightbox.open(link, button, list, resolved =>
        Math.max(0, resolved.findIndex(src => fileName(src) === name))
      );
    });
  }

  // ---------------------------------------------------------------------------
  // Request access dialog
  // ---------------------------------------------------------------------------
  function setupAccessDialog() {
    const dialog = $('#access-dialog');
    if (!dialog) return;
    let opener = null;

    for (const button of $$('[data-access]')) {
      button.addEventListener('click', () => {
        opener = button;
        dialog.showModal();
      });
    }
    // Only a click outside the box closes it; its own padding also targets the dialog.
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const box = dialog.getBoundingClientRect();
      const inside =
        event.clientX >= box.left &&
        event.clientX <= box.right &&
        event.clientY >= box.top &&
        event.clientY <= box.bottom;
      if (!inside) dialog.close();
    });
    dialog.addEventListener('close', () => {
      if (opener && opener.isConnected) opener.focus();
      opener = null;
    });
  }

  // ---------------------------------------------------------------------------
  // Start. Listeners are attached once; state is refreshed on every pageshow,
  // including a restore from the back/forward cache.
  // ---------------------------------------------------------------------------
  let started = false;

  window.addEventListener('pageshow', () => {
    if (!started) {
      started = true;
      setupGalleries();
      setupAccessDialog();
    }
    for (const dialog of $$('dialog[open]')) dialog.close();
    syncGalleries();
    rail.update();
  });
})();
