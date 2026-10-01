#!/usr/bin/env node
// Keeps every screenshot gallery on the site in sync with the image files on
// disk. Zero dependencies: Node built-ins only.
//
// A gallery is a button with class "btn-gallery" and the opt-in attribute
// data-gallery-dir="assets/<folder>". For each one, in every root *.html file
// that is not a live_* snapshot, the data-images attribute is rewritten (or
// inserted) with the images found in that folder. Nothing else in the file is
// touched.
//
// Usage: node scripts/update-galleries.mjs [--check] [--quiet] [--strict]
//                                          [--list] [--root <dir>]
// See scripts/README.md.

import { readFileSync, readdirSync, realpathSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'webp'];
export const DEFAULT_EXCLUDES = ['logo.*', '*.ico', '*.svg'];

const USAGE = `Usage: node scripts/update-galleries.mjs [options]

Syncs the data-images attribute of every .btn-gallery button that has a
data-gallery-dir attribute with the image files in that folder.

Options:
  --check       Write nothing. Exit with code 1 if any file is stale.
  --quiet       Print nothing unless something changed.
  --strict      For the deploy. A gallery that lists images must not end up
                empty: such a page is not written and the exit code is 2.
  --list        Write nothing. Print page<TAB>folder<TAB>image for every
                image the galleries list. Used by the git hook.
  --root <dir>  Site root to work on (default: the parent of this folder).
  --help        Show this help.
`;

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

const isDigit = code => code >= 48 && code <= 57;

/**
 * Natural, case-insensitive ordering: digit runs compare by numeric value, so
 * shot_2 sorts before shot_10. Hand-rolled instead of localeCompare so the
 * result is identical on every machine, whatever its locale data.
 */
export function naturalCompare(a, b) {
  const x = a.toLowerCase();
  const y = b.toLowerCase();
  let i = 0;
  let j = 0;
  while (i < x.length && j < y.length) {
    const cx = x.charCodeAt(i);
    const cy = y.charCodeAt(j);
    if (isDigit(cx) && isDigit(cy)) {
      const si = i;
      const sj = j;
      while (i < x.length && isDigit(x.charCodeAt(i))) i++;
      while (j < y.length && isDigit(y.charCodeAt(j))) j++;
      const nx = x.slice(si, i).replace(/^0+(?=\d)/, '');
      const ny = y.slice(sj, j).replace(/^0+(?=\d)/, '');
      if (nx.length !== ny.length) return nx.length < ny.length ? -1 : 1;
      if (nx !== ny) return nx < ny ? -1 : 1;
      continue;
    }
    if (cx !== cy) return cx < cy ? -1 : 1;
    i++;
    j++;
  }
  const rest = x.length - i - (y.length - j);
  if (rest !== 0) return rest < 0 ? -1 : 1;
  // Same text apart from case or leading zeros: fall back to a stable order.
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Turns a simple glob (only * is special) into a case-insensitive RegExp. */
export function globToRegExp(pattern) {
  const source = pattern
    .split('*')
    .map(part => part.replace(/[.+?^${}()|[\]\\]/g, '\\$&'))
    .join('.*');
  return new RegExp(`^${source}$`, 'i');
}

/** Splits a comma separated attribute value into trimmed, non-empty items. */
export function parseList(value) {
  return String(value ?? '')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);
}

export function isExcluded(fileName, patterns) {
  return patterns.some(pattern => globToRegExp(pattern).test(fileName));
}

export function isImageFile(fileName) {
  const ext = path.extname(fileName).slice(1).toLowerCase();
  return IMAGE_EXTENSIONS.includes(ext);
}

/** "assets\\shots/" and "./assets/shots" both become "assets/shots". */
export function normalizeGalleryDir(dir) {
  return String(dir ?? '')
    .trim()
    .replace(/\\/g, '/')
    .replace(/^(\.\/)+/, '')
    .replace(/\/+$/, '');
}

/**
 * From a plain list of file names, picks the gallery images and puts them in
 * natural order. Names containing a comma are skipped, because the lightbox
 * splits data-images on commas.
 */
export function selectImages(fileNames, excludePatterns = DEFAULT_EXCLUDES) {
  const skipped = [];
  const images = [];
  for (const name of fileNames) {
    if (!isImageFile(name) || isExcluded(name, excludePatterns)) continue;
    if (name.includes(',')) skipped.push(name);
    else images.push(name);
  }
  images.sort(naturalCompare);
  return { images, skipped };
}

// Only the characters that would change the meaning of the URL are encoded,
// so ordinary file and folder names appear exactly as they are on disk.
const encodeFileName = name =>
  name.replace(/[%#?]/g, ch => `%${ch.charCodeAt(0).toString(16).toUpperCase()}`);

const isMissing = err => err.code === 'ENOENT' || err.code === 'ENOTDIR';

/** True when a path.relative() result leads out of the folder it starts in. */
const leavesFolder = rel =>
  rel === '..' || rel.startsWith(`..${path.sep}`) || path.isAbsolute(rel);

/**
 * Walks `segments` down from `root` and returns every folder name the way it
 * is written on disk, or null when the folder does not exist. A name that
 * differs only in letter case is followed on every platform, so a Windows
 * machine and the Linux deploy runner resolve the same attribute to the same
 * folder.
 */
function namesOnDisk(root, segments) {
  const names = [];
  let current = root;
  for (const segment of segments) {
    let entries;
    try {
      entries = readdirSync(current);
    } catch (err) {
      if (!isMissing(err)) throw err;
      return null;
    }
    let name = segment;
    if (!entries.includes(segment)) {
      const wanted = segment.toLowerCase();
      const similar = entries.filter(entry => entry.toLowerCase() === wanted);
      if (similar.length !== 1) return null;
      name = similar[0];
    }
    names.push(name);
    current = path.join(current, name);
  }
  return names;
}

/**
 * Lists the gallery images of one folder as site-relative paths with forward
 * slashes. A missing or empty folder is not an error: the list is empty and a
 * warning is returned.
 *
 * Returns { dir, folder, images, files, warnings }. `images` are the paths for
 * data-images. `files` are the same images as they are named on disk, and
 * `folder` is the folder as it is named on disk.
 */
export function listGalleryImages(rootDir, galleryDir, excludePatterns = DEFAULT_EXCLUDES) {
  const dir = normalizeGalleryDir(galleryDir);
  const nothing = (folder, warnings) => ({ dir, folder, images: [], files: [], warnings });
  const root = path.resolve(rootDir);
  const rel = path.relative(root, path.resolve(root, dir));
  if (!dir || !rel || leavesFolder(rel)) {
    return nothing('', [`"${galleryDir}" is not a folder inside the site root`]);
  }

  // The paths are built from the resolved location, never from the attribute
  // text, so "assets//shots" and "assets/x/../shots" come out as "assets/shots".
  const asked = rel.split(path.sep);
  const segments = namesOnDisk(root, asked);
  if (!segments) return nothing(asked.join('/'), [`folder ${dir} does not exist`]);

  const folder = segments.join('/');
  const warnings = [];
  if (folder !== asked.join('/')) {
    warnings.push(
      `data-gallery-dir says ${asked.join('/')} but the folder on disk is ${folder}: ` +
        'the list uses the name on disk, correct the attribute'
    );
  }
  if (folder.includes(',')) {
    warnings.push(`folder ${folder} skipped: folder names with a comma cannot be listed`);
    return nothing(folder, warnings);
  }

  const abs = path.join(root, ...segments);
  let names;
  try {
    // A link or junction can point anywhere, so compare the real locations.
    const real = path.relative(realpathSync(root), realpathSync(abs));
    if (!real || leavesFolder(real)) {
      warnings.push(`folder ${folder} is a link that leads outside the site root`);
      return nothing(folder, warnings);
    }
    names = readdirSync(abs, { withFileTypes: true })
      .filter(entry => entry.isFile())
      .map(entry => entry.name);
  } catch (err) {
    if (!isMissing(err)) throw err;
    warnings.push(`folder ${dir} does not exist`);
    return nothing(folder, warnings);
  }

  const { images, skipped } = selectImages(names, excludePatterns);
  for (const name of skipped) {
    warnings.push(`${folder}/${name} skipped: file names with a comma cannot be listed`);
  }
  if (images.length === 0) warnings.push(`folder ${folder} has no images`);
  const prefix = segments.map(encodeFileName).join('/');
  return {
    dir,
    folder,
    images: images.map(name => `${prefix}/${encodeFileName(name)}`),
    files: images.map(name => `${folder}/${name}`),
    warnings,
  };
}

// ---------------------------------------------------------------------------
// HTML scanning. A small tokenizer for start tags: enough to find attributes
// with their exact offsets without touching anything else in the document.
// ---------------------------------------------------------------------------

const isSpace = ch => ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r' || ch === '\f';
const RAW_TEXT_ELEMENTS = new Set(['script', 'style', 'textarea', 'title']);

/**
 * The offset just after the comment that starts with "<!--" at `start`, or -1
 * when the comment runs to the end of the document.
 */
function commentEnd(html, start) {
  // To a browser "<!-->" and "<!--->" are complete, empty comments.
  if (html.startsWith('>', start + 4)) return start + 5;
  if (html.startsWith('->', start + 4)) return start + 6;
  const closer = /--!?>/g;
  closer.lastIndex = start + 4;
  const found = closer.exec(html);
  return found ? found.index + found[0].length : -1;
}

/**
 * Returns every start tag as { name, start, end, nameEnd, attrs }. Each
 * attribute is { name, start, end, valueStart, valueEnd, quote } with offsets
 * into the original string. Comments and the contents of script and style
 * elements are skipped.
 */
export function scanStartTags(html) {
  const tags = [];
  const tagOpen = /<([a-zA-Z][^\s/>]*)/y;
  const n = html.length;
  let i = 0;

  while (i < n) {
    const lt = html.indexOf('<', i);
    if (lt === -1) break;

    if (html.startsWith('<!--', lt)) {
      i = commentEnd(html, lt);
      if (i === -1) break;
      continue;
    }
    // "<!DOCTYPE html>", "<?xml ?>" and the like run to the first ">".
    if (html[lt + 1] === '!' || html[lt + 1] === '?') {
      const close = html.indexOf('>', lt + 2);
      if (close === -1) break;
      i = close + 1;
      continue;
    }

    tagOpen.lastIndex = lt;
    const match = tagOpen.exec(html);
    if (!match) {
      i = lt + 1;
      continue;
    }

    const name = match[1].toLowerCase();
    const nameEnd = lt + match[0].length;
    const attrs = [];
    let p = nameEnd;
    let closed = false;

    while (p < n) {
      while (p < n && (isSpace(html[p]) || html[p] === '/')) p++;
      if (p >= n) break;
      if (html[p] === '>') {
        p++;
        closed = true;
        break;
      }

      const start = p;
      p++;
      while (p < n && !isSpace(html[p]) && !'=>/'.includes(html[p])) p++;
      const attr = {
        name: html.slice(start, p).toLowerCase(),
        start,
        end: p,
        valueStart: -1,
        valueEnd: -1,
        quote: '',
      };

      let q = p;
      while (q < n && isSpace(html[q])) q++;
      if (html[q] === '=') {
        q++;
        while (q < n && isSpace(html[q])) q++;
        const ch = html[q];
        if (ch === '"' || ch === "'") {
          const close = html.indexOf(ch, q + 1);
          if (close === -1) {
            p = n;
            break;
          }
          attr.quote = ch;
          attr.valueStart = q + 1;
          attr.valueEnd = close;
          attr.end = close + 1;
        } else {
          attr.valueStart = q;
          while (q < n && !isSpace(html[q]) && html[q] !== '>') q++;
          attr.valueEnd = q;
          attr.end = q;
        }
        p = attr.end;
      }
      attrs.push(attr);
    }

    if (!closed) break;
    tags.push({ name, start: lt, end: p, nameEnd, attrs });
    i = p;

    if (RAW_TEXT_ELEMENTS.has(name)) {
      const closeTag = new RegExp(`</${name}[\\s/>]`, 'gi');
      closeTag.lastIndex = p;
      const found = closeTag.exec(html);
      if (!found) break;
      i = found.index;
    }
  }
  return tags;
}

// A Map, not an object literal: "&constructor;" must not find Object.prototype.
const ENTITIES = new Map([
  ['amp', '&'],
  ['quot', '"'],
  ['apos', "'"],
  ['lt', '<'],
  ['gt', '>'],
]);

export function decodeEntities(text) {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, body) => {
    if (body[0] !== '#') return ENTITIES.get(body.toLowerCase()) ?? whole;
    const hex = body[1] === 'x' || body[1] === 'X';
    const code = Number.parseInt(body.slice(hex ? 2 : 1), hex ? 16 : 10);
    return Number.isInteger(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : whole;
  });
}

function encodeAttribute(text, quote) {
  const escaped = text.replace(/&/g, '&amp;');
  return quote === "'" ? escaped.replace(/'/g, '&#39;') : escaped.replace(/"/g, '&quot;');
}

// The first attribute with a given name wins, as it does in browsers.
const getAttr = (tag, name) => tag.attrs.find(attr => attr.name === name);

const attrValue = (html, attr) =>
  attr && attr.valueStart !== -1 ? decodeEntities(html.slice(attr.valueStart, attr.valueEnd)) : '';

/** The offset at which every line of `text` starts. */
function lineStarts(text) {
  const starts = [0];
  for (let at = text.indexOf('\n'); at !== -1; at = text.indexOf('\n', at + 1)) starts.push(at + 1);
  return starts;
}

/** The 1-based line of `offset`, by binary search in the result of lineStarts. */
function lineAt(starts, offset) {
  let low = 0;
  let high = starts.length - 1;
  while (low < high) {
    const mid = (low + high + 1) >> 1;
    if (starts[mid] <= offset) low = mid;
    else high = mid - 1;
  }
  return low + 1;
}

function countLineFeeds(text) {
  let count = 0;
  for (let at = text.indexOf('\n'); at !== -1; at = text.indexOf('\n', at + 1)) count++;
  return count;
}

/** The whitespace to put in front of an attribute inserted after `anchor`. */
function separatorBefore(html, tag, anchor) {
  const index = tag.attrs.indexOf(anchor);
  const previousEnd = index > 0 ? tag.attrs[index - 1].end : tag.nameEnd;
  const gap = html.slice(previousEnd, anchor.start);
  const lineFeed = gap.lastIndexOf('\n');
  if (lineFeed === -1) return ' ';
  const lineStart = lineFeed > 0 && gap[lineFeed - 1] === '\r' ? lineFeed - 1 : lineFeed;
  return gap.slice(lineStart);
}

/**
 * Finds the galleries in a document: elements with class "btn-gallery" and a
 * data-gallery-dir attribute.
 */
export function findGalleries(html) {
  const galleries = [];
  const ignored = [];
  let starts;
  for (const tag of scanStartTags(html)) {
    const dirAttr = getAttr(tag, 'data-gallery-dir');
    if (!dirAttr) continue;
    starts ??= lineStarts(html);
    const line = lineAt(starts, tag.start);
    const classes = attrValue(html, getAttr(tag, 'class')).split(/\s+/);
    if (!classes.includes('btn-gallery')) {
      ignored.push({ line, reason: 'data-gallery-dir on an element without the btn-gallery class' });
      continue;
    }
    const excludeAttr = getAttr(tag, 'data-gallery-exclude');
    galleries.push({
      tag,
      line,
      dirAttr,
      excludeAttr,
      imagesAttr: getAttr(tag, 'data-images'),
      dir: attrValue(html, dirAttr),
      excludes: excludeAttr ? parseList(attrValue(html, excludeAttr)) : [...DEFAULT_EXCLUDES],
    });
  }
  return { galleries, ignored };
}

/**
 * Rewrites the data-images attribute of every gallery in `html`.
 * `resolveImages(dir, excludePatterns)` returns { images, warnings } and, when
 * it knows them, { folder, files }: the names as they are on disk.
 * Every byte outside the rewritten attribute values stays as it was.
 */
export function updateHtml(html, resolveImages) {
  const { galleries, ignored } = findGalleries(html);
  const edits = [];
  const report = [];

  for (const gallery of galleries) {
    const { tag, dirAttr, excludeAttr, imagesAttr } = gallery;
    const resolved = resolveImages(gallery.dir, gallery.excludes);
    const images = resolved.images ?? [];
    const list = images.join(',');
    let edit;

    if (!imagesAttr) {
      const anchor = excludeAttr && excludeAttr.start > dirAttr.start ? excludeAttr : dirAttr;
      const text = `${separatorBefore(html, tag, anchor)}data-images="${encodeAttribute(list, '"')}"`;
      edit = { start: anchor.end, end: anchor.end, text };
    } else if (imagesAttr.quote) {
      const text = encodeAttribute(list, imagesAttr.quote);
      if (html.slice(imagesAttr.valueStart, imagesAttr.valueEnd) !== text) {
        edit = { start: imagesAttr.valueStart, end: imagesAttr.valueEnd, text };
      }
    } else {
      // data-images without a value, or with an unquoted one: write it quoted.
      const name = html.slice(imagesAttr.start, imagesAttr.start + 'data-images'.length);
      const text = `${name}="${encodeAttribute(list, '"')}"`;
      if (html.slice(imagesAttr.start, imagesAttr.end) !== text) {
        edit = { start: imagesAttr.start, end: imagesAttr.end, text };
      }
    }
    if (edit) edits.push(edit);

    const dir = normalizeGalleryDir(gallery.dir);
    const listedBefore = parseList(attrValue(html, imagesAttr)).length;
    report.push({
      line: gallery.line,
      newLine: gallery.line,
      dir,
      folder: resolved.folder ?? dir,
      images,
      files: resolved.files ?? images,
      changed: Boolean(edit),
      listedBefore,
      emptied: listedBefore > 0 && images.length === 0,
      warnings: resolved.warnings ?? [],
    });
  }

  if (edits.length === 0) return { html, changed: false, galleries: report, ignored };

  // One pass over the document. Galleries and edits are both in document
  // order, and every edit lies inside the tag of its own gallery.
  edits.sort((a, b) => a.start - b.start);
  let next = 0;
  let shift = 0;
  galleries.forEach((gallery, k) => {
    // Edits above this gallery move it by the lines they add or remove.
    for (; next < edits.length && edits[next].start < gallery.tag.start; next++) {
      const edit = edits[next];
      shift += countLineFeeds(edit.text) - countLineFeeds(html.slice(edit.start, edit.end));
    }
    report[k].newLine = gallery.line + shift;
  });

  const pieces = [];
  let copied = 0;
  for (const edit of edits) {
    pieces.push(html.slice(copied, edit.start), edit.text);
    copied = edit.end;
  }
  pieces.push(html.slice(copied));
  const output = pieces.join('');
  return { html: output, changed: output !== html, galleries: report, ignored };
}

// ---------------------------------------------------------------------------
// Files and command line
// ---------------------------------------------------------------------------

/** Root *.html files, without the live_* snapshots of the deployed site. */
export function findHtmlFiles(rootDir) {
  return readdirSync(rootDir, { withFileTypes: true })
    .filter(entry => entry.isFile())
    .map(entry => entry.name)
    .filter(name => /\.html$/i.test(name) && !/^live_/i.test(name))
    .sort(naturalCompare);
}

/**
 * Updates one file. With write=false the file is only compared. With
 * strict=true a file in which a gallery would lose all its images is not
 * written, and the result has blocked=true.
 */
export function updateFile(rootDir, fileName, { write = true, strict = false } = {}) {
  const filePath = path.join(rootDir, fileName);
  const bytes = readFileSync(filePath);
  const html = bytes.toString('utf8');
  if (!Buffer.from(html, 'utf8').equals(bytes)) {
    throw new Error(`${fileName} is not valid UTF-8, left untouched`);
  }
  const result = updateHtml(html, (dir, excludes) => listGalleryImages(rootDir, dir, excludes));
  const blocked = strict && result.galleries.some(gallery => gallery.emptied);
  if (result.changed && write && !blocked) writeFileSync(filePath, result.html, 'utf8');
  return { file: fileName, blocked, ...result };
}

const plural = count => `${count} image${count === 1 ? '' : 's'}`;

// GitHub Actions turns lines of this shape into annotations on the run.
const escapeData = text =>
  String(text).replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');
const escapeProperty = text => escapeData(text).replace(/:/g, '%3A').replace(/,/g, '%2C');

/**
 * Runs the updater. Returns the process exit code: 0 ok, 1 stale, 2 error.
 * With annotate=true warnings and errors are printed as GitHub Actions
 * annotations, which the command line switches on inside a workflow run.
 */
export function run({
  root,
  check = false,
  quiet = false,
  strict = false,
  list = false,
  annotate = false,
  log = console.log,
  warn = console.error,
} = {}) {
  const rootDir = path.resolve(root ?? defaultRoot());
  let failed = false;
  const stale = [];

  const report = (level, file, line, message) => {
    if (!annotate) warn(`${level}: ${file}:${line} ${message}`);
    else log(`::${level} file=${escapeProperty(file)},line=${line}::${escapeData(message)}`);
  };

  let files;
  try {
    files = findHtmlFiles(rootDir);
  } catch (err) {
    warn(`error: cannot read ${rootDir}: ${err.message}`);
    return 2;
  }

  for (const file of files) {
    let result;
    try {
      result = updateFile(rootDir, file, { write: !check && !list, strict });
    } catch (err) {
      if (annotate) log(`::error file=${escapeProperty(file)}::${escapeData(err.message)}`);
      else warn(`error: ${err.message}`);
      failed = true;
      continue;
    }

    if (list) {
      for (const gallery of result.galleries) {
        if (!gallery.folder) continue;
        if (gallery.files.length === 0) log(`${file}\t${gallery.folder}\t`);
        for (const image of gallery.files) log(`${file}\t${gallery.folder}\t${image}`);
      }
      continue;
    }

    if (result.blocked) failed = true;
    if (result.changed) stale.push(file);
    if (quiet && !result.changed) continue;

    const kept = check || result.blocked;
    for (const gallery of result.galleries) {
      if (quiet && !gallery.changed) continue;
      let state = 'up to date';
      if (gallery.changed) state = check ? 'stale' : result.blocked ? 'not written' : 'updated';
      const line = kept ? gallery.line : gallery.newLine;
      log(`${file}:${line} ${gallery.dir || '(no folder)'}: ${plural(gallery.images.length)} (${state})`);
      for (const message of gallery.warnings) report('warning', file, line, message);
      if (result.blocked && gallery.emptied) {
        report(
          'error',
          file,
          line,
          `${gallery.dir} would lose all ${plural(gallery.listedBefore)} it lists now, ` +
            `${file} is left as it is (--strict)`
        );
      }
    }
    for (const item of result.ignored) report('warning', file, item.line, item.reason);
  }

  if (failed) return 2;
  if (check && stale.length > 0) {
    log(`Stale: ${stale.join(', ')}. Run "node scripts/update-galleries.mjs" to update.`);
    return 1;
  }
  return 0;
}

function defaultRoot() {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
}

export function parseArgs(argv) {
  const options = {
    check: false,
    quiet: false,
    strict: false,
    list: false,
    help: false,
    root: undefined,
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--check') options.check = true;
    else if (arg === '--quiet' || arg === '-q') options.quiet = true;
    else if (arg === '--strict') options.strict = true;
    else if (arg === '--list') options.list = true;
    else if (arg === '--help' || arg === '-h') options.help = true;
    else if (arg === '--root') {
      i++;
      if (argv[i] === undefined) throw new Error('--root needs a folder');
      options.root = argv[i];
    } else if (arg.startsWith('--root=')) options.root = arg.slice('--root='.length);
    else throw new Error(`unknown option ${arg}`);
  }
  return options;
}

function isMainModule() {
  if (!process.argv[1]) return false;
  try {
    const self = realpathSync(fileURLToPath(import.meta.url));
    const entry = realpathSync(process.argv[1]);
    return process.platform === 'win32' ? self.toLowerCase() === entry.toLowerCase() : self === entry;
  } catch {
    return false;
  }
}

if (isMainModule()) {
  let options;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (err) {
    console.error(`error: ${err.message}\n\n${USAGE}`);
    process.exit(2);
  }
  if (options.help) {
    console.log(USAGE);
    process.exit(0);
  }
  try {
    process.exitCode = run({ ...options, annotate: process.env.GITHUB_ACTIONS === 'true' });
  } catch (err) {
    console.error(`error: ${err.message}`);
    process.exitCode = 2;
  }
}
