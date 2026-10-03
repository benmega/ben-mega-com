#!/usr/bin/env node
// Screenshot and QA harness for the redesign candidates. Zero dependencies:
// it drives the installed Edge or Chrome over the DevTools protocol.
//
//   node redesigns/_tools/shot.mjs <slug>              all four views
//   node redesigns/_tools/shot.mjs current             the site in the repo root
//   node redesigns/_tools/shot.mjs <slug> --only desktop-dark,mobile-light
//   node redesigns/_tools/shot.mjs <slug> --only mobile-dark --name gallery \
//        --eval "document.querySelector('.btn-gallery').click()"
//
// Views: desktop-dark, desktop-light (1440x900), mobile-dark, mobile-light
// (390x844 at 2x). For every view it writes, into redesigns/_shots/<slug>/:
//   <view>-00.png, -01.png ...  the page one screen at a time, as a visitor
//                               scrolling would see it (00 is the first screen)
//   <view>-full.png             the whole page in one image
//   report.json                 automatic checks, also printed as a summary
//
// With --eval the script runs after the page has loaded, and only one image of
// the screen is written: <view>-<name>.png. Use it to open the lightbox or the
// dialog and look at the result.

import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { REPO_ROOT, listen } from './serve.mjs';

const VIEWS = {
  'desktop-dark': { width: 1440, height: 900, scale: 1, mobile: false, scheme: 'dark' },
  'desktop-light': { width: 1440, height: 900, scale: 1, mobile: false, scheme: 'light' },
  'mobile-dark': { width: 390, height: 844, scale: 2, mobile: true, scheme: 'dark' },
  'mobile-light': { width: 390, height: 844, scale: 2, mobile: true, scheme: 'light' },
};

/** A named view, or a size of your own such as "768x1024-light". */
function resolveView(name) {
  if (VIEWS[name]) return VIEWS[name];
  const custom = /^(\d{3,4})x(\d{3,4})-(dark|light)$/.exec(name);
  if (!custom) return null;
  const width = Number(custom[1]);
  return { width, height: Number(custom[2]), scale: width < 600 ? 2 : 1, mobile: width < 600, scheme: custom[3] };
}

let activeBrowser = null;

const MAX_TILES = 14;
const MAX_FULL_HEIGHT = 14000;

const BROWSERS = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
];

// What every candidate has to contain. Matched against the text of the page,
// ignoring case. These are checks for the reviewer, not a gate.
const REQUIRED_TEXT = [
  ['Ben Mega', /ben mega/],
  ['CS Teacher', /cs teacher/],
  ['Full-Stack Developer', /full[- ]stack developer/],
  ['Making programming accessible', /making programming accessible/],
  ['Classroom Chat', /classroom chat/],
  ['Mega Chess', /mega chess/],
  ['Auto-Prep', /auto-?prep/],
  ['Local Chat', /local chat/],
  ['Fractal Defense', /fractal defense/],
  ['Classroom Chat description (gamified)', /gamified/],
  ['Mega Chess description (asynchronous)', /asynchronous/],
  ['Auto-Prep description (Kahoot)', /kahoot/],
  ['Auto-Prep description (Blooket)', /blooket/],
  ['Auto-Prep description (Bedrock)', /bedrock/],
  ['Local Chat description (peer to peer)', /peer[- ]to[- ]peer/],
  ['Fractal Defense description (tower defense)', /tower defense/],
  ['Frontend', /front-?end/],
  ['Mobile', /mobile/],
  ['Backend', /back-?end/],
  ['AI/ML', /ai\s*[/&]\s*ml/],
  ['DevOps', /devops/],
  ...[
    'HTML', 'CSS', 'JavaScript', 'React', 'Vite', 'Android', 'Kotlin', 'SQLite', 'Firebase',
    'Python', 'Flask', 'SQLAlchemy', 'Nginx', 'Gunicorn', 'PyTorch', 'OpenAI', 'Hugging Face',
    'ComfyUI', 'AWS', 'GitHub Actions', 'Linux', 'FastAPI', 'TypeScript', 'Tailwind', 'Pygame',
  ].map(name => [name, new RegExp(name.toLowerCase().replace(/ /g, '\\s*'))]),
];

const REQUIRED_LINKS = [
  'https://github.com/benmega',
  'https://www.linkedin.com/in/benmega',
  'mailto:ben@benmega.com',
  'https://blossom.benmega.com',
  'https://github.com/benmega/classroom-chat',
  'https://prep.benmega.com',
  'https://github.com/benmega/FractalDefense',
];

const REQUIRED_SELECTORS = [
  ['Mega Chess gallery button', '.btn-gallery[data-gallery-dir="assets/mega-chess"]'],
  ['Auto-Prep gallery button', '.btn-gallery[data-gallery-dir="assets/auto-prep"]'],
  ['Fractal Defense gallery button', '.btn-gallery[data-repo="benmega/FractalDefense"]'],
  ['Request access dialog', 'dialog'],
  ['Owl image', 'img[src*="classroom-chat/logo"]'],
  ['Profile photo', 'img[src*="profile.jpg"]'],
  ['main landmark', 'main'],
  ['h1', 'h1'],
  ['meta description', 'meta[name="description"]'],
  ['meta viewport', 'meta[name="viewport"]'],
];

// ---------------------------------------------------------------------------
// Code that runs inside the page
// ---------------------------------------------------------------------------

const PAGE_HELPERS = `
(() => {
  if (window.__qa) return;
  const describe = el => {
    let s = el.tagName.toLowerCase();
    if (el.id) s += '#' + el.id;
    const cls = typeof el.className === 'string' ? el.className.trim().split(/\\s+/).filter(Boolean).slice(0, 3) : [];
    if (cls.length) s += '.' + cls.join('.');
    const text = (el.innerText || el.getAttribute('aria-label') || '').trim().replace(/\\s+/g, ' ').slice(0, 40);
    return text ? s + ' "' + text + '"' : s;
  };
  const parseColor = value => {
    const m = /rgba?\\(([^)]+)\\)/.exec(value || '');
    if (!m) return null;
    const p = m[1].split(/[\\s,/]+/).filter(Boolean).map(Number);
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  };
  const luminance = c => {
    const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
  };
  const blend = (top, under) => ({
    r: top.r * top.a + under.r * (1 - top.a),
    g: top.g * top.a + under.g * (1 - top.a),
    b: top.b * top.a + under.b * (1 - top.a),
    a: 1,
  });
  // The colour behind an element, or null when an image or gradient is involved.
  const backgroundOf = el => {
    const layers = [];
    for (let node = el; node && node.nodeType === 1; node = node.parentElement) {
      const cs = getComputedStyle(node);
      if (cs.backgroundImage && cs.backgroundImage !== 'none') return null;
      const c = parseColor(cs.backgroundColor);
      if (c && c.a > 0) {
        layers.push(c);
        if (c.a >= 1) break;
      }
    }
    const scheme = matchMedia('(prefers-color-scheme: dark)').matches;
    let base = layers.length && layers[layers.length - 1].a >= 1 ? layers.pop() : { r: 255, g: 255, b: 255, a: 1 };
    if (!layers.length && base.r === 255 && scheme && !parseColor(getComputedStyle(document.body).backgroundColor)) base = { r: 255, g: 255, b: 255, a: 1 };
    while (layers.length) base = blend(layers.pop(), base);
    return base;
  };
  const effectiveOpacity = el => {
    let o = 1;
    for (let node = el; node && node.nodeType === 1; node = node.parentElement) {
      const cs = getComputedStyle(node);
      if (cs.display === 'none' || cs.visibility === 'hidden') return -1;
      o *= parseFloat(cs.opacity);
    }
    return o;
  };
  const hasOwnText = el => Array.from(el.childNodes).some(n => n.nodeType === 3 && n.textContent.trim().length > 1);
  const inClosedLayer = el => !!el.closest('dialog:not([open]), [hidden], [aria-hidden="true"], template, noscript, script, style');

  window.__qa = {
    // Elements with text that are on screen right now but cannot be seen.
    invisibleHere() {
      const out = [];
      for (const el of document.body.querySelectorAll('*')) {
        if (!hasOwnText(el) || inClosedLayer(el)) continue;
        const r = el.getBoundingClientRect();
        if (r.width < 2 || r.height < 2 || r.bottom < 0 || r.top > innerHeight) continue;
        const o = effectiveOpacity(el);
        if (o >= 0 && o < 0.2) out.push(describe(el));
      }
      return out.slice(0, 8);
    },
    page() {
      const doc = document.documentElement;
      const overflow = doc.scrollWidth > innerWidth + 1;
      const offenders = [];
      if (overflow) {
        for (const el of document.body.querySelectorAll('*')) {
          if (inClosedLayer(el)) continue;
          const cs = getComputedStyle(el);
          if (cs.display === 'none' || cs.position === 'fixed') continue;
          const r = el.getBoundingClientRect();
          if (r.width > 0 && r.right > innerWidth + 1) offenders.push(describe(el) + ' right=' + Math.round(r.right));
          if (offenders.length >= 6) break;
        }
      }

      const images = Array.from(document.images);
      const broken = images.filter(i => i.complete && i.naturalWidth === 0 && i.getAttribute('src')).map(i => i.getAttribute('src'));
      const noAlt = images.filter(i => !i.hasAttribute('alt')).map(i => i.getAttribute('src') || describe(i));
      const upscaled = images
        .filter(i => i.naturalWidth > 0 && !inClosedLayer(i))
        .map(i => ({ i, r: i.getBoundingClientRect() }))
        .filter(({ i, r }) => r.width > i.naturalWidth * 1.15 && !/\\.svg/i.test(i.currentSrc))
        .map(({ i, r }) => i.getAttribute('src') + ' shown at ' + Math.round(r.width) + 'px wide, file is ' + i.naturalWidth + 'px');

      const unnamed = [];
      const small = [];
      for (const el of document.querySelectorAll('a[href], button, [role="button"], input, select, summary')) {
        if (inClosedLayer(el)) continue;
        const cs = getComputedStyle(el);
        if (cs.display === 'none' || cs.visibility === 'hidden') continue;
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        const name = (el.innerText || '').trim() || el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') ||
          Array.from(el.querySelectorAll('img[alt]')).map(i => i.alt).join('').trim() ||
          Array.from(el.querySelectorAll('svg title')).map(t => t.textContent).join('').trim();
        if (!name) unnamed.push(describe(el) + (el.getAttribute('href') ? ' -> ' + el.getAttribute('href') : ''));
        if ((r.width < 24 || r.height < 24) && cs.display !== 'inline') small.push(describe(el) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height));
      }

      const contrast = [];
      for (const el of document.body.querySelectorAll('*')) {
        if (!hasOwnText(el) || inClosedLayer(el)) continue;
        const cs = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        if (r.width < 2 || r.height < 2 || effectiveOpacity(el) < 0.2) continue;
        if (cs.webkitTextFillColor && parseColor(cs.webkitTextFillColor) && parseColor(cs.webkitTextFillColor).a === 0) continue;
        const fg = parseColor(cs.color);
        const bg = backgroundOf(el);
        if (!fg || !bg) continue;
        const text = blend({ ...fg, a: fg.a * Math.min(1, effectiveOpacity(el)) }, bg);
        const l1 = luminance(text), l2 = luminance(bg);
        const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
        const size = parseFloat(cs.fontSize);
        const large = size >= 24 || (size >= 18.66 && parseInt(cs.fontWeight, 10) >= 700);
        if (ratio < (large ? 3 : 4.5)) contrast.push({ ratio: Math.round(ratio * 100) / 100, size: Math.round(size), el: describe(el) });
      }
      contrast.sort((a, b) => a.ratio - b.ratio);

      const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
        .filter(h => !inClosedLayer(h))
        .map(h => h.tagName.toLowerCase() + ' ' + h.innerText.trim().replace(/\\s+/g, ' ').slice(0, 50));

      return {
        title: document.title,
        lang: doc.getAttribute('lang'),
        pageHeight: doc.scrollHeight,
        overflowX: overflow,
        overflowOffenders: offenders,
        brokenImages: broken,
        imagesWithoutAlt: noAlt,
        upscaledImages: upscaled,
        unnamedControls: unnamed.slice(0, 10),
        smallTapTargets: small.slice(0, 10),
        lowContrast: contrast.slice(0, 12),
        lowContrastCount: contrast.length,
        headings,
        h1Count: document.querySelectorAll('h1').length,
        text: document.body.textContent.toLowerCase().replace(/\\s+/g, ' '),
        titles: Array.from(document.querySelectorAll('[title], [aria-label], img[alt]'))
          .map(e => [e.getAttribute('title'), e.getAttribute('aria-label'), e.getAttribute('alt')].filter(Boolean).join(' '))
          .join(' ').toLowerCase(),
        links: Array.from(document.querySelectorAll('a[href]')).map(a => a.getAttribute('href')),
      };
    },
  };
})();
`;

// ---------------------------------------------------------------------------
// DevTools protocol client
// ---------------------------------------------------------------------------

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function launchBrowser() {
  const exe = process.env.SHOT_BROWSER || BROWSERS.find(candidate => existsSync(candidate));
  if (!exe) throw new Error('No Edge or Chrome found. Set SHOT_BROWSER to the path of a Chromium browser.');
  const profile = mkdtempSync(path.join(tmpdir(), 'shot-profile-'));
  const child = spawn(
    exe,
    [
      '--headless=new',
      '--disable-gpu',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-extensions',
      '--disable-background-networking',
      '--disable-background-mode',
      '--hide-scrollbars',
      '--mute-audio',
      `--user-data-dir=${profile}`,
      '--remote-debugging-port=0',
      'about:blank',
    ],
    { stdio: ['ignore', 'ignore', 'pipe'] },
  );

  // The DevTools address is read from stderr, or else from the DevToolsActivePort
  // file in the profile. The file also works when the process we started hands
  // over to another one and exits, which Edge does on some machines.
  const endpoint = new Promise((resolve, reject) => {
    let buffer = '';
    let settled = false;
    const finish = (err, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      clearInterval(poll);
      if (err) reject(err);
      else resolve(value);
    };
    const timer = setTimeout(() => finish(new Error('The browser did not start within 45 seconds.')), 45000);
    const poll = setInterval(() => {
      try {
        const [port, wsPath] = readFileSync(path.join(profile, 'DevToolsActivePort'), 'utf8').trim().split(/\s+/);
        if (port && wsPath) finish(null, `ws://127.0.0.1:${port}${wsPath}`);
      } catch {
        // Not written yet.
      }
    }, 150);
    child.stderr.on('data', chunk => {
      buffer += chunk;
      const match = /DevTools listening on (ws:\/\/\S+)/.exec(buffer);
      if (match) finish(null, match[1]);
    });
    child.once('error', err => finish(err));
  });

  const exited = new Promise(resolve => child.once('exit', resolve));
  const close = async () => {
    // Browser.close has been sent by now; give the browser a moment to leave.
    if (child.exitCode === null) await Promise.race([exited, sleep(2000)]);
    if (process.platform === 'win32') {
      // On Windows the process we started hands over to another one and
      // exits, so the browser is found by its profile folder, which is unique
      // to this run, and not by process id.
      // Only the main process is stopped, together with its tree: stopping the
      // helper processes one by one makes Edge start itself again.
      // Single quotes only: double quotes do not survive the trip to PowerShell.
      const stop =
        `Get-CimInstance Win32_Process | ` +
        `Where-Object { $_.Name -match 'msedge|chrome' -and $_.CommandLine -like '*${path.basename(profile)}*' ` +
        `-and $_.CommandLine -notmatch '--type=' } | ` +
        `ForEach-Object { taskkill /PID $_.ProcessId /T /F | Out-Null }`;
      await new Promise(resolve => {
        spawn('powershell', ['-NoProfile', '-NonInteractive', '-Command', stop], { stdio: 'ignore' })
          .once('exit', resolve)
          .once('error', resolve);
      });
    } else if (child.exitCode === null) {
      child.kill('SIGKILL');
      await Promise.race([exited, sleep(3000)]);
    }
    await sleep(1200);
    try {
      rmSync(profile, { recursive: true, force: true, maxRetries: 8, retryDelay: 400 });
    } catch {
      // A locked profile folder in the temp directory is harmless.
    }
  };
  return { endpoint, close };
}

async function connect(wsUrl) {
  const socket = new WebSocket(wsUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', () => reject(new Error('Could not connect to the browser.')), { once: true });
  });

  let nextId = 1;
  const pending = new Map();
  const listeners = new Set();

  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject, method } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) reject(new Error(`${method}: ${message.error.message}`));
      else resolve(message.result);
      return;
    }
    for (const listener of listeners) listener(message);
  });

  const send = (method, params = {}, sessionId) =>
    new Promise((resolve, reject) => {
      const id = nextId++;
      const timer = setTimeout(() => {
        pending.delete(id);
        reject(new Error(`${method} timed out`));
      }, 45000);
      pending.set(id, {
        method,
        resolve: value => {
          clearTimeout(timer);
          resolve(value);
        },
        reject: err => {
          clearTimeout(timer);
          reject(err);
        },
      });
      socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
    });

  const on = listener => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };
  const waitFor = (method, sessionId, timeout = 20000) =>
    new Promise(resolve => {
      const timer = setTimeout(() => {
        off();
        resolve(false);
      }, timeout);
      const off = on(message => {
        if (message.method === method && (!sessionId || message.sessionId === sessionId)) {
          clearTimeout(timer);
          off();
          resolve(true);
        }
      });
    });

  return { send, on, waitFor, close: () => socket.close() };
}

// ---------------------------------------------------------------------------
// One view
// ---------------------------------------------------------------------------

async function captureView(cdp, url, viewName, view, outDir, options) {
  const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
  const call = (method, params) => cdp.send(method, params, sessionId);

  const consoleErrors = [];
  const failedRequests = [];
  const off = cdp.on(message => {
    if (message.sessionId !== sessionId) return;
    const p = message.params;
    if (message.method === 'Runtime.exceptionThrown') {
      consoleErrors.push(`exception: ${p.exceptionDetails.exception?.description ?? p.exceptionDetails.text}`.slice(0, 300));
    } else if (message.method === 'Runtime.consoleAPICalled' && p.type === 'error') {
      consoleErrors.push(`console.error: ${p.args.map(a => a.value ?? a.description ?? '').join(' ')}`.slice(0, 300));
    } else if (message.method === 'Log.entryAdded' && p.entry.level === 'error') {
      consoleErrors.push(`${p.entry.source}: ${p.entry.text} ${p.entry.url ?? ''}`.slice(0, 300));
    } else if (message.method === 'Network.responseReceived' && p.response.status >= 400) {
      failedRequests.push(`${p.response.status} ${p.response.url}`);
    } else if (message.method === 'Network.loadingFailed' && !p.canceled) {
      failedRequests.push(`${p.errorText} (${p.type})`);
    }
  });

  const evaluate = async (expression, awaitPromise = true) => {
    const result = await call('Runtime.evaluate', { expression, awaitPromise, returnByValue: true });
    if (result.exceptionDetails) {
      throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
    }
    return result.result.value;
  };
  const screenshot = async (file, params = {}) => {
    const { data } = await call('Page.captureScreenshot', { format: 'png', ...params });
    writeFileSync(path.join(outDir, file), Buffer.from(data, 'base64'));
    return file;
  };

  try {
    await call('Page.enable');
    await call('Runtime.enable');
    await call('Log.enable');
    await call('Network.enable');
    await call('Emulation.setDeviceMetricsOverride', {
      width: view.width,
      height: view.height,
      deviceScaleFactor: view.scale,
      mobile: view.mobile,
    });
    if (view.mobile) await call('Emulation.setTouchEmulationEnabled', { enabled: true });
    await call('Emulation.setEmulatedMedia', {
      features: [
        { name: 'prefers-color-scheme', value: view.scheme },
        ...(options.reducedMotion ? [{ name: 'prefers-reduced-motion', value: 'reduce' }] : []),
      ],
    });

    const loaded = cdp.waitFor('Page.loadEventFired', sessionId);
    await call('Page.navigate', { url });
    const didLoad = await loaded;
    await evaluate('document.fonts ? document.fonts.ready.then(() => true) : true').catch(() => {});
    await sleep(900);
    await evaluate(PAGE_HELPERS, false);

    const result = { view: viewName, loaded: didLoad, files: [] };

    if (options.eval) {
      // Scroll once through the page so lazy content is in place, then act.
      await evaluate(`(async () => {
        for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight) {
          scrollTo(0, y); await new Promise(r => setTimeout(r, 120));
        }
        scrollTo(0, 0); await new Promise(r => setTimeout(r, 300));
      })()`);
      result.evalResult = await evaluate(`(async () => { ${options.eval} })()`)
        .then(value => (value === undefined ? 'ok' : value))
        .catch(err => `error: ${err.message}`);
      await sleep(options.wait);
      result.files.push(await screenshot(`${viewName}-${options.name}.png`));
      result.consoleErrors = consoleErrors;
      return result;
    }

    // Walk down the page one screen at a time, the way a visitor would.
    const invisible = new Set();
    let tiles = 0;
    let truncated = false;
    for (let index = 0; ; index++) {
      const state = await evaluate(`(async () => {
        const max = Math.max(0, document.documentElement.scrollHeight - innerHeight);
        const y = Math.min(${index} * innerHeight, max);
        scrollTo({ left: 0, top: y, behavior: 'instant' });
        await new Promise(r => setTimeout(r, ${index === 0 ? 300 : 1100}));
        // Staggered reveals get up to four more seconds before they count as stuck.
        let hidden = window.__qa.invisibleHere();
        for (let tries = 0; hidden.length && tries < 4; tries++) {
          await new Promise(r => setTimeout(r, 1000));
          hidden = window.__qa.invisibleHere();
        }
        return { y: scrollY, max, wanted: ${index} * innerHeight, hidden };
      })()`);
      if (index > 0 && state.wanted >= state.max + view.height) break;
      if (index >= MAX_TILES) {
        truncated = true;
        break;
      }
      for (const item of state.hidden) invisible.add(item);
      result.files.push(await screenshot(`${viewName}-${String(index).padStart(2, '0')}.png`));
      tiles++;
      if (state.wanted >= state.max) break;
    }

    await evaluate(`scrollTo({ left: 0, top: 0, behavior: 'instant' })`, false);
    await sleep(400);
    const page = await evaluate('window.__qa.page()');

    const fullHeight = Math.min(page.pageHeight, MAX_FULL_HEIGHT);
    result.files.push(
      await screenshot(`${viewName}-full.png`, {
        captureBeyondViewport: true,
        clip: { x: 0, y: 0, width: view.width, height: fullHeight, scale: view.mobile ? 1 : 0.75 },
      }),
    );

    const haystack = `${page.text} ${page.titles}`;
    const normalise = href => href.replace(/\/+$/, '').toLowerCase();
    const hrefs = page.links.map(normalise);
    const missingSelectors = await evaluate(
      `(${JSON.stringify(REQUIRED_SELECTORS)}).filter(([, s]) => !document.querySelector(s)).map(([n]) => n)`,
    );

    Object.assign(result, {
      tiles,
      tilesTruncated: truncated,
      title: page.title,
      lang: page.lang,
      pageHeight: page.pageHeight,
      screens: Math.round((page.pageHeight / view.height) * 10) / 10,
      overflowX: page.overflowX,
      overflowOffenders: page.overflowOffenders,
      invisibleText: [...invisible],
      brokenImages: page.brokenImages,
      upscaledImages: page.upscaledImages,
      imagesWithoutAlt: page.imagesWithoutAlt,
      unnamedControls: page.unnamedControls,
      smallTapTargets: view.mobile ? page.smallTapTargets : [],
      lowContrastCount: page.lowContrastCount,
      lowContrast: page.lowContrast,
      h1Count: page.h1Count,
      headings: page.headings,
      missingText: REQUIRED_TEXT.filter(([, pattern]) => !pattern.test(haystack)).map(([name]) => name),
      missingLinks: REQUIRED_LINKS.filter(link => !hrefs.some(href => href.startsWith(normalise(link)))),
      missingElements: missingSelectors,
      deadLinks: page.links.filter(href => href === '#' || href === ''),
      consoleErrors: [...new Set(consoleErrors)],
      failedRequests: [...new Set(failedRequests)],
    });
    return result;
  } finally {
    off();
    await cdp.send('Target.closeTarget', { targetId }).catch(() => {});
  }
}

// ---------------------------------------------------------------------------
// Command line
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const options = { target: '', only: Object.keys(VIEWS), out: '', eval: '', name: 'action', wait: 700, reducedMotion: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--only') options.only = argv[++i].split(',').map(s => s.trim()).filter(Boolean);
    else if (arg === '--out') options.out = argv[++i];
    else if (arg === '--eval') options.eval = argv[++i];
    else if (arg === '--name') options.name = argv[++i].replace(/[^a-z0-9_-]/gi, '-');
    else if (arg === '--wait') options.wait = Number(argv[++i]) || 700;
    else if (arg === '--reduced-motion') options.reducedMotion = true;
    else if (arg === '--help' || arg === '-h') options.help = true;
    else if (!options.target) options.target = arg;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return options;
}

function summarise(report) {
  const lines = [];
  for (const v of report.views) {
    if (v.error) {
      lines.push(`${v.view}: FAILED ${v.error}`);
      continue;
    }
    if (v.evalResult !== undefined) {
      lines.push(`${v.view}: wrote ${v.files.join(', ')} (script result: ${JSON.stringify(v.evalResult)})`);
      for (const e of v.consoleErrors ?? []) lines.push(`    console: ${e}`);
      continue;
    }
    lines.push(`${v.view}: ${v.pageHeight}px tall (${v.screens} screens), ${v.tiles} screen images${v.tilesTruncated ? ' (page is longer, the rest was not captured)' : ''}`);
    const list = (label, items, max = 6) => {
      if (!items?.length) return;
      lines.push(`    ${label}:`);
      for (const item of items.slice(0, max)) lines.push(`      - ${typeof item === 'string' ? item : JSON.stringify(item)}`);
      if (items.length > max) lines.push(`      ... and ${items.length - max} more`);
    };
    if (v.overflowX) list('HORIZONTAL SCROLL, caused by', v.overflowOffenders.length ? v.overflowOffenders : ['(element not identified)']);
    list('TEXT ON SCREEN BUT INVISIBLE (stuck animation?)', v.invisibleText);
    list('BROKEN IMAGES', v.brokenImages);
    list('CONSOLE ERRORS', v.consoleErrors);
    list('FAILED REQUESTS', v.failedRequests);
    list('MISSING TEXT', v.missingText, 40);
    list('MISSING LINKS', v.missingLinks, 20);
    list('MISSING ELEMENTS', v.missingElements, 20);
    list('DEAD LINKS (href="#")', v.deadLinks);
    list('IMAGES SHOWN LARGER THAN THE FILE', v.upscaledImages);
    list('IMAGES WITHOUT ALT', v.imagesWithoutAlt);
    list('CONTROLS WITHOUT A NAME', v.unnamedControls);
    list('TAP TARGETS UNDER 24px', v.smallTapTargets);
    if (v.h1Count !== 1) lines.push(`    H1 COUNT is ${v.h1Count}, expected 1`);
    if (v.lowContrastCount) list(`LOW CONTRAST (${v.lowContrastCount} elements, estimate, worst first)`, v.lowContrast, 8);
  }
  return lines.join('\n');
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help || !options.target) {
    console.log('Usage: node redesigns/_tools/shot.mjs <slug | current | url> [--only views] [--out dir]\n' +
      '         [--eval "js" --name label --wait ms] [--reduced-motion]\n' +
      `Views: ${Object.keys(VIEWS).join(', ')}, or a size of your own such as 768x1024-light`);
    process.exit(options.help ? 0 : 1);
  }
  for (const name of options.only) {
    if (!resolveView(name)) {
      throw new Error(`Unknown view "${name}". Views: ${Object.keys(VIEWS).join(', ')}, or a size such as 768x1024-light`);
    }
  }

  const isUrl = /^https?:\/\//i.test(options.target);
  const slug = isUrl ? 'url' : options.target.replace(/[\\/]+$/, '').split(/[\\/]/).pop();
  if (!isUrl && slug !== 'current' && !existsSync(path.join(REPO_ROOT, 'redesigns', slug, 'index.html'))) {
    throw new Error(`redesigns/${slug}/index.html does not exist.`);
  }
  const outDir = path.resolve(options.out || path.join(REPO_ROOT, 'redesigns', '_shots', slug));
  mkdirSync(outDir, { recursive: true });

  // A full run replaces the previous screen images of the views it renders.
  if (!options.eval) {
    for (const file of readdirSync(outDir)) {
      if (options.only.some(name => new RegExp(`^${name}-(\\d\\d|full)\\.png$`).test(file))) {
        rmSync(path.join(outDir, file), { force: true });
      }
    }
  }

  const { server, port } = await listen(0);
  const url = isUrl ? options.target : slug === 'current' ? `http://127.0.0.1:${port}/` : `http://127.0.0.1:${port}/redesigns/${slug}/`;

  const browser = launchBrowser();
  activeBrowser = browser;
  const report = { target: slug, url, outDir, views: [] };
  let cdp;
  try {
    cdp = await connect(await browser.endpoint);
    for (const name of options.only) {
      try {
        report.views.push(await captureView(cdp, url, name, resolveView(name), outDir, options));
      } catch (err) {
        report.views.push({ view: name, error: err.message });
      }
    }
  } finally {
    // Ask the browser to quit, so its helper processes go with it.
    await Promise.race([cdp?.send('Browser.close').catch(() => {}), sleep(3000)]);
    cdp?.close();
    await browser.close();
    server.close();
  }

  const reportFile = options.eval ? `report-${options.name}.json` : options.only.length === Object.keys(VIEWS).length ? 'report.json' : `report-${options.only.join('+')}.json`;
  writeFileSync(path.join(outDir, reportFile), `${JSON.stringify(report, null, 2)}\n`);

  console.log(`Images and ${reportFile} written to ${outDir}`);
  console.log(summarise(report));
  process.exit(report.views.some(v => v.error) ? 1 : 0);
}

const overall = setTimeout(async () => {
  console.error('shot.mjs: gave up after 6 minutes. Render one view at a time with --only.');
  await activeBrowser?.close().catch(() => {});
  process.exit(2);
}, 360000);
overall.unref();

main().catch(err => {
  console.error(`shot.mjs: ${err.message}`);
  process.exit(1);
});
