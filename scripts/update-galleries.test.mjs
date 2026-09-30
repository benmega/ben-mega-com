// Self-test for update-galleries.mjs. Run from the repository root with:
//   node --test scripts/
// Every test works in its own temporary folder; the real site is never touched.

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  chmodSync,
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  renameSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  DEFAULT_EXCLUDES,
  decodeEntities,
  findHtmlFiles,
  globToRegExp,
  listGalleryImages,
  naturalCompare,
  parseArgs,
  parseList,
  run,
  scanStartTags,
  selectImages,
  updateHtml,
} from './update-galleries.mjs';

const SCRIPT = path.join(path.dirname(fileURLToPath(import.meta.url)), 'update-galleries.mjs');

/** Creates a temporary site. `files` maps relative paths to contents. */
function makeSite(t, files = {}) {
  const root = mkdtempSync(path.join(tmpdir(), 'galleries-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  for (const [name, content] of Object.entries(files)) {
    const target = path.join(root, name);
    mkdirSync(path.dirname(target), { recursive: true });
    writeFileSync(target, content);
  }
  return root;
}

const read = (root, name) => readFileSync(path.join(root, name), 'utf8');

/** Runs the updater in-process and captures what it prints. */
function runQuietly(options) {
  const out = [];
  const err = [];
  const code = run({ ...options, log: line => out.push(line), warn: line => err.push(line) });
  return { code, out, err };
}

// GITHUB_ACTIONS is cleared so that the output is the same inside a workflow.
const cliWith = (env, ...args) =>
  spawnSync(process.execPath, [SCRIPT, ...args], {
    encoding: 'utf8',
    env: { ...process.env, GITHUB_ACTIONS: '', ...env },
  });
const cli = (...args) => cliWith({}, ...args);

const fixed = images => () => ({ images, warnings: [] });

const SHOTS = {
  'assets/demo/shot_1.png': 'x',
  'assets/demo/shot_2.png': 'x',
  'assets/demo/shot_10.png': 'x',
  'assets/demo/logo.png': 'x',
};
const SHOT_LIST = 'assets/demo/shot_1.png,assets/demo/shot_2.png,assets/demo/shot_10.png';

const button = attrs => `<div>\n  <button\n${attrs.map(a => `    ${a}\n`).join('')}  >\n    Screenshots\n  </button>\n</div>\n`;

// --- ordering and filtering -------------------------------------------------

test('natural sort puts shot_2 before shot_10', () => {
  const names = ['shot_10.png', 'shot_2.png', 'shot_1.png', 'Shot_3.png', 'shot_02b.png'];
  assert.deepEqual(names.sort(naturalCompare), [
    'shot_1.png',
    'shot_2.png',
    'shot_02b.png',
    'Shot_3.png',
    'shot_10.png',
  ]);
  assert.deepEqual(['b.png', 'a10.png', 'a.png', 'a9.png'].sort(naturalCompare), [
    'a.png',
    'a9.png',
    'a10.png',
    'b.png',
  ]);
  assert.equal(naturalCompare('same.png', 'same.png'), 0);
  // Longer than any number type can hold: still compared by value.
  assert.equal(naturalCompare('n99999999999999999999.png', 'n100000000000000000000.png'), -1);
});

test('glob patterns support * only and ignore case', () => {
  assert.ok(globToRegExp('logo.*').test('logo.png'));
  assert.ok(globToRegExp('logo.*').test('LOGO.PNG'));
  assert.ok(!globToRegExp('logo.*').test('my-logo.png'));
  assert.ok(!globToRegExp('logo.*').test('logoXpng'));
  assert.ok(globToRegExp('*.ico').test('favicon.ico'));
  assert.ok(globToRegExp('*draft*').test('a-draft-2.png'));
  assert.ok(globToRegExp('a+b(1).png').test('a+b(1).png'));
  assert.ok(!globToRegExp('shot?.png').test('shot1.png'));
});

test('default exclusions drop logo.*, *.ico and *.svg', () => {
  assert.deepEqual(DEFAULT_EXCLUDES, ['logo.*', '*.ico', '*.svg']);
  const { images } = selectImages(['logo.png', 'logo.webp', 'icon.ico', 'art.svg', 'one.png']);
  assert.deepEqual(images, ['one.png']);
});

test('only png, jpg, jpeg, gif and webp count as images', () => {
  const names = ['a.png', 'b.JPG', 'c.jpeg', 'd.gif', 'e.webp', 'f.bmp', 'g.txt', 'h', '.gitkeep', 'i.png.bak'];
  assert.deepEqual(selectImages(names, []).images, ['a.png', 'b.JPG', 'c.jpeg', 'd.gif', 'e.webp']);
});

test('file names with a comma are skipped and reported', () => {
  const { images, skipped } = selectImages(['a,b.png', 'c.png'], []);
  assert.deepEqual(images, ['c.png']);
  assert.deepEqual(skipped, ['a,b.png']);
});

test('parseList trims items and drops empty ones', () => {
  assert.deepEqual(parseList(' logo.* , ,*.gif,'), ['logo.*', '*.gif']);
  assert.deepEqual(parseList(''), []);
});

test('listGalleryImages is not recursive and uses forward slashes', t => {
  const root = makeSite(t, { ...SHOTS, 'assets/demo/nested/deep.png': 'x', 'assets/demo/notes.txt': 'x' });
  for (const dir of ['assets/demo', 'assets\\demo', './assets/demo/']) {
    const { images, warnings } = listGalleryImages(root, dir);
    assert.deepEqual(images, SHOT_LIST.split(','));
    assert.deepEqual(warnings, []);
  }
});

test('custom exclusion patterns replace the defaults', t => {
  const root = makeSite(t, SHOTS);
  const { images } = listGalleryImages(root, 'assets/demo', ['shot_1*']);
  assert.deepEqual(images, ['assets/demo/logo.png', 'assets/demo/shot_2.png']);
});

test('a folder outside the site root is refused', t => {
  const root = makeSite(t, SHOTS);
  for (const dir of ['..', '../elsewhere', '', '.']) {
    const { images, warnings } = listGalleryImages(root, dir);
    assert.deepEqual(images, []);
    assert.equal(warnings.length, 1);
  }
});

// --- rewriting --------------------------------------------------------------

test('insertion: data-images is added after data-gallery-dir in the same style', () => {
  const html = button(['class="btn btn-secondary btn-gallery"', 'data-title="Demo"', 'data-gallery-dir="assets/demo"']);
  const result = updateHtml(html, fixed(['assets/demo/a.png', 'assets/demo/b.png']));
  assert.equal(
    result.html,
    button([
      'class="btn btn-secondary btn-gallery"',
      'data-title="Demo"',
      'data-gallery-dir="assets/demo"',
      'data-images="assets/demo/a.png,assets/demo/b.png"',
    ])
  );
  assert.equal(result.changed, true);
  assert.equal(result.galleries.length, 1);
  assert.equal(result.galleries[0].line, 2);
});

test('insertion goes after data-gallery-exclude when that comes last', () => {
  const html = button(['class="btn-gallery"', 'data-gallery-dir="assets/demo"', 'data-gallery-exclude="*.gif"']);
  const seen = [];
  const result = updateHtml(html, (dir, excludes) => {
    seen.push({ dir, excludes });
    return { images: ['assets/demo/a.png'], warnings: [] };
  });
  assert.deepEqual(seen, [{ dir: 'assets/demo', excludes: ['*.gif'] }]);
  assert.equal(
    result.html,
    button([
      'class="btn-gallery"',
      'data-gallery-dir="assets/demo"',
      'data-gallery-exclude="*.gif"',
      'data-images="assets/demo/a.png"',
    ])
  );
});

test('insertion on a one-line tag stays on that line', () => {
  const html = '<button class="btn-gallery" data-gallery-dir="assets/demo">Shots</button>\n';
  const result = updateHtml(html, fixed(['assets/demo/a.png']));
  assert.equal(
    result.html,
    '<button class="btn-gallery" data-gallery-dir="assets/demo" data-images="assets/demo/a.png">Shots</button>\n'
  );
});

test('replacement keeps attribute order and everything around it', () => {
  const html = button([
    'class="btn btn-primary btn-gallery"',
    'data-images="assets/demo/old.png"',
    'data-title="Demo"',
    'data-gallery-dir="assets/demo"',
  ]);
  const result = updateHtml(html, fixed(['assets/demo/new_1.png', 'assets/demo/new_2.png']));
  assert.equal(result.html, html.replace('assets/demo/old.png', 'assets/demo/new_1.png,assets/demo/new_2.png'));
});

test('single quotes are kept', () => {
  const html = "<button class='btn-gallery' data-gallery-dir='assets/demo' data-images='old.png'>x</button>";
  const result = updateHtml(html, fixed(["assets/demo/it's.png"]));
  assert.equal(
    result.html,
    "<button class='btn-gallery' data-gallery-dir='assets/demo' data-images='assets/demo/it&#39;s.png'>x</button>"
  );
});

test('multi-line attributes: value on its own line or spread over lines', () => {
  const html = [
    '<button',
    '  class="btn',
    '    btn-gallery"',
    '  data-gallery-dir=',
    '    "assets/demo"',
    '  data-images=',
    '    "assets/demo/old_1.png,',
    '     assets/demo/old_2.png"',
    '  onclick="if (a > b) { go(\'<x>\') }"',
    '>',
    '  Screenshots',
    '</button>',
    '',
  ].join('\n');
  const result = updateHtml(html, fixed(['assets/demo/a.png']));
  assert.equal(
    result.html,
    html.replace('assets/demo/old_1.png,\n     assets/demo/old_2.png', 'assets/demo/a.png')
  );
});

test('data-images without quotes or without a value is rewritten quoted', () => {
  const bare = '<button class="btn-gallery" data-gallery-dir="assets/demo" data-images>x</button>';
  assert.equal(
    updateHtml(bare, fixed(['assets/demo/a.png'])).html,
    '<button class="btn-gallery" data-gallery-dir="assets/demo" data-images="assets/demo/a.png">x</button>'
  );
  const unquoted = '<button class=btn-gallery data-images=old.png data-gallery-dir=assets/demo>x</button>';
  assert.equal(
    updateHtml(unquoted, fixed(['assets/demo/a.png'])).html,
    '<button class=btn-gallery data-images="assets/demo/a.png" data-gallery-dir=assets/demo>x</button>'
  );
});

test('CRLF line endings are preserved, also on the inserted line', t => {
  const lf = [
    button(['class="btn-gallery"', 'data-title="Insert"', 'data-gallery-dir="assets/demo"']),
    button(['class="btn-gallery"', 'data-gallery-dir="assets/demo"', 'data-images="stale.png"']),
  ].join('');
  const crlf = lf.replace(/\n/g, '\r\n');
  const root = makeSite(t, { ...SHOTS, 'index.html': crlf });

  assert.equal(runQuietly({ root }).code, 0);

  const after = read(root, 'index.html');
  assert.equal(after.replace(/\r\n/g, '').includes('\n'), false, 'no bare LF');
  assert.equal(after.replace(/\r\n/g, '').includes('\r'), false, 'no bare CR');
  assert.equal(
    after,
    [
      button(['class="btn-gallery"', 'data-title="Insert"', 'data-gallery-dir="assets/demo"', `data-images="${SHOT_LIST}"`]),
      button(['class="btn-gallery"', 'data-gallery-dir="assets/demo"', `data-images="${SHOT_LIST}"`]),
    ]
      .join('')
      .replace(/\n/g, '\r\n')
  );
});

test('LF files stay LF, and a BOM and non-ASCII text survive', t => {
  const html = `﻿<p>Ω café</p>\n${button(['class="btn-gallery"', 'data-gallery-dir="assets/demo"'])}`;
  const root = makeSite(t, { ...SHOTS, 'index.html': html });
  runQuietly({ root });
  const bytes = readFileSync(path.join(root, 'index.html'));
  assert.deepEqual([...bytes.subarray(0, 3)], [0xef, 0xbb, 0xbf]);
  const after = bytes.toString('utf8');
  assert.equal(after.includes('\r'), false);
  assert.equal(after, html.replace('"assets/demo"\n', `"assets/demo"\n    data-images="${SHOT_LIST}"\n`));
});

test('a button without data-gallery-dir is left untouched', t => {
  const html = [
    button(['class="btn btn-primary btn-gallery"', 'data-title="Remote"', 'data-repo="someone/project"', 'data-folder="screenshots"']),
    button(['class="btn btn-primary btn-gallery"', 'data-title="Manual"', 'data-images="assets/demo/only_this.png"']),
  ].join('');
  const root = makeSite(t, { ...SHOTS, 'index.html': html });
  const { code, out } = runQuietly({ root });
  assert.equal(code, 0);
  assert.deepEqual(out, []);
  assert.equal(read(root, 'index.html'), html);
});

test('comments, scripts and elements without the btn-gallery class are ignored', () => {
  const html = [
    '<!-- <button class="btn-gallery" data-gallery-dir="assets/demo"></button> -->',
    '<script>const s = \'<button class="btn-gallery" data-gallery-dir="assets/demo">\';</script>',
    '<style>/* <button class="btn-gallery" data-gallery-dir="assets/demo"> */</style>',
    '<a class="btn" data-gallery-dir="assets/demo">not a gallery</a>',
    '',
  ].join('\n');
  const result = updateHtml(html, fixed(['assets/demo/a.png']));
  assert.equal(result.html, html);
  assert.equal(result.changed, false);
  assert.equal(result.galleries.length, 0);
  assert.equal(result.ignored.length, 1);
  assert.equal(result.ignored[0].line, 4);
});

test('several galleries in one file are all updated', () => {
  const html = [
    button(['class="btn-gallery"', 'data-gallery-dir="assets/one"']),
    button(['class="btn-gallery"', 'data-gallery-dir="assets/two"', 'data-images=""']),
  ].join('');
  const result = updateHtml(html, dir => ({ images: [`${dir}/a.png`], warnings: [] }));
  assert.equal(
    result.html,
    [
      button(['class="btn-gallery"', 'data-gallery-dir="assets/one"', 'data-images="assets/one/a.png"']),
      button(['class="btn-gallery"', 'data-gallery-dir="assets/two"', 'data-images="assets/two/a.png"']),
    ].join('')
  );
});

test('the tag scanner reports exact attribute offsets', () => {
  const html = '<p title="a > b">text</p><img src=x.png alt>';
  const [p, img] = scanStartTags(html);
  assert.equal(p.name, 'p');
  assert.equal(html.slice(p.start, p.end), '<p title="a > b">');
  assert.equal(html.slice(p.attrs[0].valueStart, p.attrs[0].valueEnd), 'a > b');
  assert.deepEqual(
    img.attrs.map(a => [a.name, a.valueStart === -1 ? null : html.slice(a.valueStart, a.valueEnd)]),
    [
      ['src', 'x.png'],
      ['alt', null],
    ]
  );
});

// --- whole runs -------------------------------------------------------------

test('exclusion patterns from data-gallery-exclude are applied', t => {
  const html = button(['class="btn-gallery"', 'data-gallery-dir="assets/demo"', 'data-gallery-exclude="logo.*, *_10.png"']);
  const root = makeSite(t, { ...SHOTS, 'index.html': html });
  runQuietly({ root });
  assert.match(read(root, 'index.html'), /data-images="assets\/demo\/shot_1\.png,assets\/demo\/shot_2\.png"/);
});

test('an empty data-gallery-exclude switches the default exclusions off', t => {
  const html = button(['class="btn-gallery"', 'data-gallery-dir="assets/demo"', 'data-gallery-exclude=""']);
  const root = makeSite(t, { ...SHOTS, 'index.html': html });
  runQuietly({ root });
  assert.match(read(root, 'index.html'), /data-images="assets\/demo\/logo\.png,assets\/demo\/shot_1\.png,/);
});

test('idempotent: a second run changes nothing', t => {
  const html = button(['class="btn-gallery"', 'data-title="Demo"', 'data-gallery-dir="assets/demo"']);
  const root = makeSite(t, { ...SHOTS, 'index.html': html });

  const first = runQuietly({ root });
  assert.equal(first.code, 0);
  assert.deepEqual(first.out, ['index.html:2 assets/demo: 3 images (updated)']);
  const afterFirst = readFileSync(path.join(root, 'index.html'));

  const second = runQuietly({ root });
  assert.equal(second.code, 0);
  assert.deepEqual(second.out, ['index.html:2 assets/demo: 3 images (up to date)']);
  assert.ok(readFileSync(path.join(root, 'index.html')).equals(afterFirst));

  const third = runQuietly({ root, quiet: true });
  assert.deepEqual([third.code, third.out, third.err], [0, [], []]);
});

test('--quiet prints only when something changed', t => {
  const html = button(['class="btn-gallery"', 'data-gallery-dir="assets/demo"', `data-images="${SHOT_LIST}"`]);
  const root = makeSite(t, { ...SHOTS, 'index.html': html });

  const calm = cli('--quiet', '--root', root);
  assert.deepEqual([calm.status, calm.stdout, calm.stderr], [0, '', '']);

  writeFileSync(path.join(root, 'assets/demo/shot_11.png'), 'x');
  const busy = cli('--quiet', '--root', root);
  assert.equal(busy.status, 0);
  assert.equal(busy.stdout.trim(), 'index.html:2 assets/demo: 4 images (updated)');
  assert.ok(read(root, 'index.html').includes(`${SHOT_LIST},assets/demo/shot_11.png`));
});

test('--check exits with 1 when stale and writes nothing', t => {
  const html = button(['class="btn-gallery"', 'data-gallery-dir="assets/demo"', 'data-images="assets/demo/shot_1.png"']);
  const root = makeSite(t, { ...SHOTS, 'index.html': html, 'about.html': '<p>no galleries</p>\n' });

  const stale = cli('--check', '--root', root);
  assert.equal(stale.status, 1);
  assert.match(stale.stdout, /index\.html:2 assets\/demo: 3 images \(stale\)/);
  assert.match(stale.stdout, /Stale: index\.html\./);
  assert.doesNotMatch(stale.stdout, /about\.html/);
  assert.equal(read(root, 'index.html'), html, '--check must not write');

  assert.equal(cli('--root', root).status, 0);
  const fresh = cli('--check', '--root', root);
  assert.equal(fresh.status, 0);
  assert.match(fresh.stdout, /\(up to date\)/);
  assert.equal(cli('--check', '--quiet', '--root', root).stdout, '');
});

test('live_* snapshots are ignored', t => {
  const html = button(['class="btn-gallery"', 'data-gallery-dir="assets/demo"']);
  const root = makeSite(t, {
    ...SHOTS,
    'index.html': html,
    'live_index.html': html,
    'Live_other.html': html,
    'pages/nested.html': html,
    'notes.txt': html,
  });
  assert.deepEqual(findHtmlFiles(root), ['index.html']);

  assert.equal(cli('--root', root).status, 0);
  assert.notEqual(read(root, 'index.html'), html);
  for (const name of ['live_index.html', 'Live_other.html', 'pages/nested.html', 'notes.txt']) {
    assert.equal(read(root, name), html, `${name} must stay untouched`);
  }
  assert.equal(cli('--check', '--root', root).status, 0);
});

test('a missing or empty folder gives an empty list and a warning, not an error', t => {
  const html = [
    button(['class="btn-gallery"', 'data-gallery-dir="assets/missing"']),
    button(['class="btn-gallery"', 'data-gallery-dir="assets/empty"', 'data-images="assets/empty/gone.png"']),
  ].join('');
  const root = makeSite(t, { 'index.html': html, 'assets/empty/.gitkeep': '' });

  const { code, out, err } = runQuietly({ root });
  assert.equal(code, 0);
  assert.deepEqual(out, [
    'index.html:2 assets/missing: 0 images (updated)',
    'index.html:11 assets/empty: 0 images (updated)',
  ]);
  assert.deepEqual(err, [
    'warning: index.html:2 folder assets/missing does not exist',
    'warning: index.html:11 folder assets/empty has no images',
  ]);
  assert.equal(
    read(root, 'index.html'),
    [
      button(['class="btn-gallery"', 'data-gallery-dir="assets/missing"', 'data-images=""']),
      button(['class="btn-gallery"', 'data-gallery-dir="assets/empty"', 'data-images=""']),
    ].join('')
  );
  const check = runQuietly({ root, check: true });
  assert.equal(check.code, 0);
  assert.deepEqual(check.out, [
    'index.html:2 assets/missing: 0 images (up to date)',
    'index.html:11 assets/empty: 0 images (up to date)',
  ]);
});

test('--check reports the line numbers of the file as it is on disk', t => {
  const html = [
    button(['class="btn-gallery"', 'data-gallery-dir="assets/demo"']),
    button(['class="btn-gallery"', 'data-gallery-dir="assets/demo"', 'data-images="old.png"']),
  ].join('');
  const root = makeSite(t, { ...SHOTS, 'index.html': html });
  const { code, out } = runQuietly({ root, check: true });
  assert.equal(code, 1);
  assert.deepEqual(out.slice(0, 2), [
    'index.html:2 assets/demo: 3 images (stale)',
    'index.html:10 assets/demo: 3 images (stale)',
  ]);
  assert.equal(read(root, 'index.html'), html);
});

test('a file that is not valid UTF-8 is reported and left alone', t => {
  const bytes = Buffer.concat([
    Buffer.from('<button class="btn-gallery" data-gallery-dir="assets/demo">'),
    Buffer.from([0xff, 0xfe]),
    Buffer.from('</button>'),
  ]);
  const root = makeSite(t, { ...SHOTS, 'index.html': bytes });
  const { code, err } = runQuietly({ root });
  assert.equal(code, 2);
  assert.match(err[0], /not valid UTF-8/);
  assert.ok(readFileSync(path.join(root, 'index.html')).equals(bytes));
});

test('command line options', () => {
  assert.deepEqual(parseArgs([]), {
    check: false,
    quiet: false,
    strict: false,
    list: false,
    help: false,
    root: undefined,
  });
  assert.deepEqual(parseArgs(['--check', '--quiet', '--root', 'site']), {
    check: true,
    quiet: true,
    strict: false,
    list: false,
    help: false,
    root: 'site',
  });
  assert.equal(parseArgs(['--strict']).strict, true);
  assert.equal(parseArgs(['--list']).list, true);
  assert.equal(parseArgs(['--root=site']).root, 'site');
  assert.throws(() => parseArgs(['--fix']), /unknown option/);
  assert.throws(() => parseArgs(['--root']), /needs a folder/);
  assert.equal(cli('--nonsense').status, 2);
});

// --- folders: letter case, odd names, links ---------------------------------

test('a folder whose letter case differs is listed with the names on disk', t => {
  const html = button(['class="btn-gallery"', 'data-gallery-dir="Assets/Demo"']);
  const root = makeSite(t, { ...SHOTS, 'index.html': html });

  const listed = listGalleryImages(root, 'Assets/Demo');
  assert.deepEqual(listed.images, SHOT_LIST.split(','));
  assert.deepEqual(listed.files, SHOT_LIST.split(','));
  assert.equal(listed.folder, 'assets/demo');
  assert.equal(listed.warnings.length, 1);
  assert.match(listed.warnings[0], /says Assets\/Demo but the folder on disk is assets\/demo/);

  // The same on a Windows machine and on the Linux deploy runner.
  const { code, out, err } = runQuietly({ root });
  assert.equal(code, 0);
  assert.deepEqual(out, ['index.html:2 Assets/Demo: 3 images (updated)']);
  assert.equal(err.length, 1);
  assert.match(err[0], /^warning: index\.html:2 data-gallery-dir says Assets\/Demo /);
  assert.ok(read(root, 'index.html').includes(`data-images="${SHOT_LIST}"`));
  assert.equal(runQuietly({ root, check: true }).code, 0);
});

test('with two folders that differ only in case the exact name is needed', t => {
  const root = makeSite(t, { 'assets/demo/lower.png': 'x' });
  try {
    mkdirSync(path.join(root, 'assets/DEMO'));
  } catch {
    t.skip('this file system ignores letter case');
    return;
  }
  writeFileSync(path.join(root, 'assets/DEMO/upper.png'), 'x');
  assert.deepEqual(listGalleryImages(root, 'assets/demo').images, ['assets/demo/lower.png']);
  assert.deepEqual(listGalleryImages(root, 'assets/DEMO').images, ['assets/DEMO/upper.png']);
  const unclear = listGalleryImages(root, 'assets/Demo');
  assert.deepEqual(unclear.images, []);
  assert.deepEqual(unclear.warnings, ['folder assets/Demo does not exist']);
});

test('the folder part of every path comes from the disk, not from the attribute', t => {
  const root = makeSite(t, {
    'assets/demo/in.png': 'x',
    'assets/c#d/s1.png': 'x',
    'assets/100%/s1.png': 'x',
    'assets/a,b/s1.png': 'x',
  });
  const detours = [
    'assets//demo',
    'assets/./demo',
    'assets/nope/../demo',
    `../${path.basename(root)}/assets/demo`,
    'assets\\demo\\',
  ];
  for (const dir of detours) {
    const { images, warnings } = listGalleryImages(root, dir);
    assert.deepEqual(images, ['assets/demo/in.png'], dir);
    assert.deepEqual(warnings, [], dir);
  }

  const hash = listGalleryImages(root, 'assets/c#d');
  assert.deepEqual(hash.images, ['assets/c%23d/s1.png']);
  assert.deepEqual(hash.files, ['assets/c#d/s1.png']);
  assert.deepEqual(listGalleryImages(root, 'assets/100%').images, ['assets/100%25/s1.png']);

  const comma = listGalleryImages(root, 'assets/a,b');
  assert.deepEqual(comma.images, []);
  assert.deepEqual(comma.warnings, ['folder assets/a,b skipped: folder names with a comma cannot be listed']);
});

test('a folder inside the root whose name starts with two dots is accepted', t => {
  const root = makeSite(t, { '..shots/in.png': 'x', 'assets/..more/in.png': 'x' });
  for (const dir of ['..shots', 'assets/..more']) {
    const { images, warnings } = listGalleryImages(root, dir);
    assert.deepEqual(images, [`${dir}/in.png`]);
    assert.deepEqual(warnings, []);
  }
});

test('a link or junction that leads outside the site root is refused', t => {
  const base = makeSite(t, {
    'site/assets/real/in.png': 'x',
    'private-photos/passport_scan.png': 'x',
  });
  const root = path.join(base, 'site');
  const type = process.platform === 'win32' ? 'junction' : 'dir';
  try {
    symlinkSync(path.join(base, 'private-photos'), path.join(root, 'assets/outside'), type);
    symlinkSync(path.join(root, 'assets/real'), path.join(root, 'assets/inside'), type);
    symlinkSync(root, path.join(base, 'alias'), type);
  } catch (err) {
    t.skip(`links cannot be created here (${err.code})`);
    return;
  }

  const outside = listGalleryImages(root, 'assets/outside');
  assert.deepEqual(outside.images, []);
  assert.deepEqual(outside.warnings, ['folder assets/outside is a link that leads outside the site root']);

  // A link that stays inside the site is an ordinary folder to the browser.
  assert.deepEqual(listGalleryImages(root, 'assets/inside').images, ['assets/inside/in.png']);
  // And so is a site root that is itself reached through a link.
  assert.deepEqual(listGalleryImages(path.join(base, 'alias'), 'assets/real').images, [
    'assets/real/in.png',
  ]);

  writeFileSync(
    path.join(root, 'index.html'),
    button(['class="btn-gallery"', 'data-gallery-dir="assets/outside"'])
  );
  const { code, err } = runQuietly({ root });
  assert.equal(code, 0);
  assert.deepEqual(err, ['warning: index.html:2 folder assets/outside is a link that leads outside the site root']);
  assert.doesNotMatch(read(root, 'index.html'), /passport/);
});

// --- scanning ---------------------------------------------------------------

test('short and unusual comments end where a browser ends them', () => {
  const gallery = '<button class="btn-gallery" data-gallery-dir="assets/demo">x</button>';
  const ended = ['<!-->', '<!--->', '<!---->', '<!-- a --!>', '<!-- > -->', '<!DOCTYPE html>', '<?xml version="1.0"?>'];
  for (const comment of ended) {
    const html = `${comment}\n${gallery}\n<!-- later -->\n${gallery}\n`;
    const result = updateHtml(html, fixed(['assets/demo/a.png']));
    assert.deepEqual(result.galleries.map(g => g.line), [2, 4], comment);
    assert.equal(result.html.split('data-images="assets/demo/a.png"').length, 3, comment);
  }

  const open = ['<!-- ', '<!--- ', '<!--!> ', '<!-- --> <!-- '];
  for (const comment of open) {
    const html = `${comment}\n${gallery}\n-->\n${gallery}\n`;
    const result = updateHtml(html, fixed(['assets/demo/a.png']));
    assert.deepEqual(result.galleries.map(g => g.line), [4], comment);
  }

  const never = `<!-- never closed\n${gallery}\n`;
  assert.equal(updateHtml(never, fixed(['assets/demo/a.png'])).html, never);
});

test('entity-like text that names a member of Object.prototype is left alone', () => {
  for (const name of ['constructor', 'toString', 'valueOf', 'hasOwnProperty', 'isPrototypeOf']) {
    assert.equal(decodeEntities(`a&${name};b`), `a&${name};b`);
  }
  assert.equal(decodeEntities('&amp;&quot;&apos;&lt;&gt;&#65;&#x42;&AMP;&nope;'), '&"\'<>AB&&nope;');

  const seen = [];
  updateHtml('<button class="btn-gallery" data-gallery-dir="assets/&constructor;">x</button>', dir => {
    seen.push(dir);
    return { images: [], warnings: [] };
  });
  assert.deepEqual(seen, ['assets/&constructor;']);
});

/** The 1-based numbers of the lines on which a gallery button starts. */
const buttonLines = html =>
  html
    .split('\n')
    .map((line, index) => (line.includes('<button') ? index + 1 : 0))
    .filter(Boolean);

test('line numbers follow inserted lines and values that lose lines', () => {
  const html = [
    button(['class="btn-gallery"', 'data-gallery-dir="assets/one"']),
    button(['class="btn-gallery"', 'data-gallery-dir="assets/two"', 'data-images="old_1.png,\n      old_2.png,\n      old_3.png"']),
    button(['class="btn-gallery"', 'data-gallery-dir="assets/three"', 'data-images="assets/three/a.png"']),
    button(['class="btn-gallery"', 'data-gallery-dir="assets/four"']),
    button(['class="btn-gallery"', 'data-gallery-dir="assets/five"', 'data-images=""']),
  ]
    .join('')
    .replace(/\n/g, '\r\n');
  const result = updateHtml(html, dir => ({ images: [`${dir}/a.png`], warnings: [] }));

  assert.deepEqual(result.galleries.map(g => g.line), buttonLines(html));
  assert.deepEqual(result.galleries.map(g => g.newLine), buttonLines(result.html));
  assert.deepEqual(result.galleries.map(g => g.line), [2, 10, 21, 30, 38]);
  assert.deepEqual(result.galleries.map(g => g.newLine), [2, 11, 20, 29, 38]);
  assert.deepEqual(result.galleries.map(g => g.changed), [true, true, false, true, true]);
});

test('a large page with many galleries is rewritten in one pass', () => {
  const filler = '<p class="x">Lorem ipsum dolor sit amet</p>\n'.repeat(400);
  const count = 300;
  let html = '';
  let expected = '';
  for (let k = 0; k < count; k++) {
    html += filler + button(['class="btn-gallery"', `data-gallery-dir="assets/g${k}"`]);
    expected +=
      filler +
      button(['class="btn-gallery"', `data-gallery-dir="assets/g${k}"`, `data-images="assets/g${k}/a.png"`]);
  }
  assert.ok(html.length > 5_000_000);

  const started = performance.now();
  const result = updateHtml(html, dir => ({ images: [`${dir}/a.png`], warnings: [] }));
  const elapsed = performance.now() - started;

  assert.ok(result.html === expected, 'the rewritten page is what was expected');
  assert.deepEqual(result.galleries.map(g => g.line), buttonLines(html));
  assert.deepEqual(result.galleries.map(g => g.newLine), buttonLines(expected));
  // The earlier version needed several seconds for this; one pass needs a fraction.
  assert.ok(elapsed < 2500, `took ${Math.round(elapsed)} ms`);
});

// --- --strict, --list and annotations ---------------------------------------

test('--strict refuses to empty a gallery that lists images', t => {
  const html = [
    button(['class="btn-gallery"', 'data-gallery-dir="assets/demo"', 'data-images="assets/demo/shot_1.png"']),
    button(['class="btn-gallery"', 'data-gallery-dir="assets/gone"', 'data-images="assets/gone/a.png,assets/gone/b.png"']),
    button(['class="btn-gallery"', 'data-gallery-dir="assets/later"', 'data-images=""']),
  ].join('');
  const root = makeSite(t, { ...SHOTS, 'index.html': html, 'assets/later/.gitkeep': '' });

  const strict = runQuietly({ root, strict: true });
  assert.equal(strict.code, 2);
  assert.equal(read(root, 'index.html'), html, 'a blocked page is not written');
  assert.deepEqual(strict.out, [
    'index.html:2 assets/demo: 3 images (not written)',
    'index.html:11 assets/gone: 0 images (not written)',
    'index.html:20 assets/later: 0 images (up to date)',
  ]);
  assert.deepEqual(strict.err, [
    'warning: index.html:11 folder assets/gone does not exist',
    'error: index.html:11 assets/gone would lose all 2 images it lists now, index.html is left as it is (--strict)',
    'warning: index.html:20 folder assets/later has no images',
  ]);

  const viaCli = cli('--strict', '--quiet', '--root', root);
  assert.equal(viaCli.status, 2);
  assert.match(viaCli.stderr, /would lose all 2 images/);
  assert.equal(read(root, 'index.html'), html);

  // The images come back: the same strict run goes through.
  mkdirSync(path.join(root, 'assets/gone'));
  writeFileSync(path.join(root, 'assets/gone/a.png'), 'x');
  assert.equal(runQuietly({ root, strict: true }).code, 0);
  assert.ok(read(root, 'index.html').includes('data-images="assets/gone/a.png"'));

  // Without --strict an emptied folder is a warning, as it always was.
  renameSync(path.join(root, 'assets/gone'), path.join(root, 'assets/moved'));
  const loose = runQuietly({ root });
  assert.equal(loose.code, 0);
  assert.ok(read(root, 'index.html').includes('data-gallery-dir="assets/gone"\n    data-images=""'));
  // And a list that is empty already may stay empty in a strict run.
  assert.equal(runQuietly({ root, strict: true }).code, 0);
});

test('--list prints page, folder and image, and writes nothing', t => {
  const html = [
    button(['class="btn-gallery"', 'data-gallery-dir="Assets/Demo"']),
    button(['class="btn-gallery"', 'data-gallery-dir="assets/empty"']),
    button(['class="btn-gallery"', 'data-gallery-dir="assets/c#d"']),
    button(['class="btn-gallery"', 'data-gallery-dir="assets/missing"']),
    button(['class="btn-gallery"', 'data-gallery-dir=".."']),
  ].join('');
  const root = makeSite(t, {
    ...SHOTS,
    'assets/empty/.gitkeep': '',
    'assets/c#d/s 1.png': 'x',
    'index.html': html,
    'live_index.html': html,
  });

  const listed = cli('--list', '--root', root);
  assert.equal(listed.status, 0);
  assert.equal(listed.stderr, '');
  assert.deepEqual(listed.stdout.replace(/\n$/, '').split('\n'), [
    'index.html\tassets/demo\tassets/demo/shot_1.png',
    'index.html\tassets/demo\tassets/demo/shot_2.png',
    'index.html\tassets/demo\tassets/demo/shot_10.png',
    'index.html\tassets/empty\t',
    'index.html\tassets/c#d\tassets/c#d/s 1.png',
    'index.html\tassets/missing\t',
  ]);
  assert.equal(read(root, 'index.html'), html);
});

test('inside GitHub Actions warnings and errors become annotations', t => {
  const html = [
    button(['class="btn-gallery"', 'data-gallery-dir="assets/missing"', 'data-images=""']),
    button(['class="btn-gallery"', 'data-gallery-dir="assets/gone"', 'data-images="assets/gone/a.png"']),
  ].join('');
  const root = makeSite(t, { 'index.html': html });

  const plain = cli('--check', '--root', root);
  assert.match(plain.stderr, /^warning: index\.html:2 folder assets\/missing does not exist$/m);
  assert.doesNotMatch(plain.stdout, /::/);

  const inActions = cliWith({ GITHUB_ACTIONS: 'true' }, '--strict', '--root', root);
  assert.equal(inActions.status, 2);
  assert.equal(inActions.stderr, '');
  const lines = inActions.stdout.replace(/\n$/, '').split('\n');
  assert.deepEqual(lines, [
    'index.html:2 assets/missing: 0 images (up to date)',
    '::warning file=index.html,line=2::folder assets/missing does not exist',
    'index.html:11 assets/gone: 0 images (not written)',
    '::warning file=index.html,line=11::folder assets/gone does not exist',
    '::error file=index.html,line=11::assets/gone would lose all 1 image it lists now, index.html is left as it is (--strict)',
  ]);
  assert.equal(read(root, 'index.html'), html);

  const { out, err } = runQuietly({ root, annotate: true });
  assert.deepEqual(err, []);
  assert.ok(out.includes('::warning file=index.html,line=11::folder assets/gone does not exist'));
});

// --- the git hook -----------------------------------------------------------
// Every test builds its own throwaway repository in a temporary folder. All
// GIT_* variables are dropped first, so that git can never be pointed at the
// repository the tests are started from.

const HOOK = path.join(path.dirname(SCRIPT), '..', '.githooks', 'pre-commit');
const HAS_GIT = spawnSync('git', ['--version']).status === 0;
const needsGit = { skip: HAS_GIT ? false : 'git is not installed' };

const HOOK_PAGE = button([
  'class="btn btn-gallery"',
  'data-title="Shots"',
  'data-gallery-dir="assets/shots"',
  'data-images="assets/shots/shot_1.png"',
]);
const ONE = 'data-images="assets/shots/shot_1.png"';
const TWO = 'data-images="assets/shots/shot_1.png,assets/shots/shot_2.png"';

const samePath = (a, b) => {
  const [x, y] = [a, b].map(item => path.resolve(item));
  return process.platform === 'win32' ? x.toLowerCase() === y.toLowerCase() : x === y;
};

function makeRepo(t, { autocrlf = 'false', page = HOOK_PAGE } = {}) {
  const base = realpathSync(mkdtempSync(path.join(tmpdir(), 'galleries-hook-')));
  t.after(() => rmSync(base, { recursive: true, force: true, maxRetries: 5 }));
  const repo = path.join(base, 'repo');
  const env = { GITHUB_ACTIONS: '' };
  for (const [key, value] of Object.entries(process.env)) {
    if (!/^GIT_/i.test(key) && key !== 'GITHUB_ACTIONS') env[key] = value;
  }
  Object.assign(env, {
    GIT_CONFIG_NOSYSTEM: '1',
    GIT_CONFIG_GLOBAL: path.join(base, 'gitconfig'),
    GIT_TERMINAL_PROMPT: '0',
  });
  writeFileSync(env.GIT_CONFIG_GLOBAL, '');

  const files = {
    'index.html': page,
    'assets/shots/shot_1.png': 'x',
    'notes/todo.txt': 'one\n',
  };
  for (const [name, content] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(repo, name)), { recursive: true });
    writeFileSync(path.join(repo, name), content);
  }
  mkdirSync(path.join(repo, 'scripts'));
  mkdirSync(path.join(repo, '.githooks'));
  copyFileSync(SCRIPT, path.join(repo, 'scripts/update-galleries.mjs'));
  copyFileSync(HOOK, path.join(repo, '.githooks/pre-commit'));
  chmodSync(path.join(repo, '.githooks/pre-commit'), 0o755);

  const git = (...args) => {
    const extra = typeof args.at(-1) === 'object' ? args.pop() : {};
    const result = spawnSync('git', args, { cwd: repo, encoding: 'utf8', env: { ...env, ...extra } });
    return {
      status: result.status,
      stdout: result.stdout ?? '',
      output: `${result.stdout ?? ''}${result.stderr ?? ''}`,
    };
  };
  const must = (...args) => {
    const result = git(...args);
    assert.equal(result.status, 0, `git ${args.join(' ')}\n${result.output}`);
    return result;
  };

  must('init', '--quiet', '.');
  assert.ok(
    samePath(realpathSync(must('rev-parse', '--show-toplevel').stdout.trim()), repo),
    'git must work in the throwaway repository and nowhere else'
  );
  must('config', 'user.email', 'hook-test@example.invalid');
  must('config', 'user.name', 'Hook Test');
  must('config', 'commit.gpgsign', 'false');
  must('config', 'core.autocrlf', autocrlf);
  must('config', 'core.safecrlf', 'false');
  must('add', '--all');
  must('commit', '--quiet', '--no-verify', '-m', 'initial');
  must('config', 'core.hooksPath', '.githooks');

  return {
    repo,
    env,
    git,
    must,
    write: (name, content) => writeFileSync(path.join(repo, name), content),
    read: name => readFileSync(path.join(repo, name), 'utf8'),
    committed: () => must('show', '--name-only', '--format=', 'HEAD').stdout.trim().split('\n').sort(),
    show: spec => must('show', spec).stdout,
    status: () => must('status', '--short').stdout.replace(/\n$/, ''),
  };
}

test('the hook file is a POSIX sh script with LF line endings', () => {
  const hook = readFileSync(HOOK, 'utf8');
  assert.ok(hook.startsWith('#!/bin/sh\n'));
  assert.equal(hook.includes('\r'), false);
});

for (const autocrlf of ['false', 'true']) {
  test(`hook: a staged screenshot takes the updated page along (autocrlf ${autocrlf})`, needsGit, t => {
    const eol = autocrlf === 'true' ? '\r\n' : '\n';
    const r = makeRepo(t, { autocrlf, page: HOOK_PAGE.replace(/\n/g, eol) });
    r.write('assets/shots/shot_2.png', 'x');
    r.must('add', 'assets/shots/shot_2.png');

    const commit = r.must('commit', '-m', 'second screenshot');
    assert.match(commit.output, /pre-commit: galleries updated and staged: index\.html/);
    assert.deepEqual(r.committed(), ['assets/shots/shot_2.png', 'index.html']);
    assert.ok(r.show('HEAD:index.html').includes(TWO));
    assert.equal(r.read('index.html'), HOOK_PAGE.replace(ONE, TWO).replace(/\n/g, eol));
    assert.equal(r.status(), '');

    // Nothing left to do: the next commit is not touched.
    r.write('notes/todo.txt', 'two\n');
    const next = r.must('commit', '--all', '-m', 'notes');
    assert.doesNotMatch(next.output, /pre-commit/);
    assert.deepEqual(r.committed(), ['notes/todo.txt']);
  });
}

test('hook: a partial commit stages nothing and leaves the index as it was', needsGit, t => {
  const r = makeRepo(t);
  r.write('assets/shots/shot_2.png', 'x');
  r.must('add', 'assets/shots/shot_2.png');

  const commit = r.must('commit', '-m', 'image only', '--', 'assets/shots/shot_2.png');
  assert.match(commit.output, /index\.html but NOT staged, because this is a partial commit/);
  assert.deepEqual(r.committed(), ['assets/shots/shot_2.png']);
  assert.ok(r.show('HEAD:index.html').includes(ONE));
  assert.ok(r.show(':index.html').includes(ONE));
  assert.ok(r.read('index.html').includes(TWO));
  // Not "MM": the index holds no change that would undo the list later.
  assert.equal(r.status(), ' M index.html');

  r.write('notes/todo.txt', 'two\n');
  r.must('add', 'notes/todo.txt');
  r.must('commit', '-m', 'unrelated');
  assert.deepEqual(r.committed(), ['notes/todo.txt']);

  r.must('add', 'index.html');
  r.must('commit', '-m', 'the page');
  assert.deepEqual(r.committed(), ['index.html']);
  assert.ok(r.show('HEAD:index.html').includes(TWO));
  assert.equal(r.status(), '');
});

test('hook: commit --all stages the page in the index that is being committed', needsGit, t => {
  const r = makeRepo(t);
  r.write('assets/shots/shot_2.png', 'x');
  r.must('add', 'assets/shots/shot_2.png');
  r.write('notes/todo.txt', 'two\n');

  r.must('commit', '--all', '-m', 'everything');
  assert.deepEqual(r.committed(), ['assets/shots/shot_2.png', 'index.html', 'notes/todo.txt']);
  assert.ok(r.show('HEAD:index.html').includes(TWO));
  assert.equal(r.status(), '');
});

test('hook: images that are not in the commit keep the page out of it', needsGit, t => {
  const r = makeRepo(t);
  r.write('assets/shots/shot_2.png', 'x');
  r.write('assets/shots/draft_wip.png', 'x');
  r.write('notes/todo.txt', 'two\n');
  r.must('add', 'notes/todo.txt');

  const commit = r.must('commit', '-m', 'unrelated');
  assert.match(commit.output, /NOT staged, because it lists images that are not in this commit:/);
  assert.match(commit.output, /^ {2}assets\/shots\/draft_wip\.png$/m);
  assert.match(commit.output, /^ {2}assets\/shots\/shot_2\.png$/m);
  assert.doesNotMatch(commit.output, /^ {2}assets\/shots\/shot_1\.png$/m);
  assert.deepEqual(r.committed(), ['notes/todo.txt']);
  assert.ok(r.show('HEAD:index.html').includes(ONE));
  assert.equal(
    r.status(),
    [' M index.html', '?? assets/shots/draft_wip.png', '?? assets/shots/shot_2.png'].join('\n')
  );
});

test('hook: a page with unstaged edits is updated on disk but not staged', needsGit, t => {
  const r = makeRepo(t);
  r.write('index.html', `${HOOK_PAGE}<p>work in progress</p>\n`);
  r.write('assets/shots/shot_2.png', 'x');
  r.must('add', 'assets/shots/shot_2.png');

  const commit = r.must('commit', '-m', 'second screenshot');
  assert.match(commit.output, /NOT staged, because the file has other unstaged changes/);
  assert.deepEqual(r.committed(), ['assets/shots/shot_2.png']);
  assert.equal(r.read('index.html'), `${HOOK_PAGE.replace(ONE, TWO)}<p>work in progress</p>\n`);
  assert.equal(r.status(), ' M index.html');
});

test('hook: a page that was updated before the commit gets a reminder', needsGit, t => {
  const r = makeRepo(t);
  r.write('assets/shots/shot_2.png', 'x');
  const updated = spawnSync(process.execPath, ['scripts/update-galleries.mjs', '--quiet'], {
    cwd: r.repo,
    encoding: 'utf8',
    env: r.env,
  });
  assert.equal(updated.status, 0);
  r.must('add', 'assets/shots');

  const commit = r.must('commit', '-m', 'new screenshots');
  assert.match(commit.output, /pre-commit: this commit adds or removes images in:\n {2}assets\/shots\n/);
  assert.match(commit.output, /git add index\.html && git commit --amend --no-edit/);
  assert.deepEqual(r.committed(), ['assets/shots/shot_2.png']);
  assert.equal(r.status(), ' M index.html');

  // No images in the commit: no reminder, however the page looks.
  r.write('notes/todo.txt', 'two\n');
  r.must('add', 'notes/todo.txt');
  assert.doesNotMatch(r.must('commit', '-m', 'unrelated').output, /pre-commit/);
});

test('hook: without node the commit goes through with a warning', needsGit, t => {
  const r = makeRepo(t);
  const key = Object.keys(r.env).find(name => name.toUpperCase() === 'PATH');
  const names = process.platform === 'win32' ? ['node.exe', 'node.cmd', 'node'] : ['node'];
  const isFile = file => {
    try {
      readFileSync(file);
      return true;
    } catch {
      return false;
    }
  };
  const withoutNode = r.env[key]
    .split(path.delimiter)
    .filter(dir => dir && !names.some(name => isFile(path.join(dir, name))))
    .join(path.delimiter);
  const env = { [key]: withoutNode };
  if (r.git('--version', env).status !== 0) {
    t.skip('git and node live in the same folder here');
    return;
  }

  r.write('assets/shots/shot_2.png', 'x');
  r.must('add', 'assets/shots/shot_2.png');
  const commit = r.git('commit', '-m', 'no node', env);
  assert.equal(commit.status, 0, commit.output);
  assert.match(commit.output, /pre-commit: node not found, galleries not updated \(commit continues\)/);
  assert.deepEqual(r.committed(), ['assets/shots/shot_2.png']);
  assert.ok(r.read('index.html').includes(ONE));
});
