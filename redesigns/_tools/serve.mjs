#!/usr/bin/env node
// Preview server for the redesign candidates. Zero dependencies.
//
//   node redesigns/_tools/serve.mjs [--port 4173]
//
//   /                             the repository root (the current site)
//   /redesigns/<slug>/...         that candidate's folder
//   /redesigns/<slug>/assets/...  the repository's assets/ folder
//
// The last rule lets every candidate use the same relative paths as the real
// site (assets/profile.jpg, styles.css, script.js), so promoting a candidate
// is a plain copy of its files into the repository root.

import { createReadStream, statSync } from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

// Never served, whatever the URL says.
const BLOCKED = /^(\.git|\.github|\.githooks|\.idea|\.venv|\.claude|node_modules)(\/|$)/i;

/** Maps a URL path to a file inside the repository, or null. */
export function resolveRequest(urlPath, root = REPO_ROOT) {
  let decoded;
  try {
    decoded = decodeURIComponent(urlPath);
  } catch {
    return null;
  }
  let rel = path.posix.normalize(decoded.replace(/\\/g, '/')).replace(/^\/+/, '');
  if (rel.startsWith('..')) return null;

  const candidateAsset = /^redesigns\/[^/]+\/(assets\/.*)$/i.exec(rel);
  if (candidateAsset) rel = candidateAsset[1];
  if (BLOCKED.test(rel)) return null;

  const abs = path.resolve(root, rel);
  const back = path.relative(root, abs);
  if (back.startsWith('..') || path.isAbsolute(back)) return null;
  return abs;
}

export function createServer(root = REPO_ROOT) {
  return http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const send = (status, body) => {
      res.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(body);
    };

    let file = resolveRequest(url.pathname, root);
    if (!file) return send(404, 'Not found');

    let stat;
    try {
      stat = statSync(file);
    } catch {
      return send(404, 'Not found');
    }

    if (stat.isDirectory()) {
      // Relative URLs only resolve correctly when the folder ends in a slash.
      if (!url.pathname.endsWith('/')) {
        res.writeHead(302, { Location: `${url.pathname}/${url.search}` });
        return res.end();
      }
      file = path.join(file, 'index.html');
      try {
        stat = statSync(file);
      } catch {
        return send(404, 'Not found');
      }
    }

    res.writeHead(200, {
      'Content-Type': MIME[path.extname(file).toLowerCase()] ?? 'application/octet-stream',
      'Content-Length': stat.size,
      'Cache-Control': 'no-store',
    });
    if (req.method === 'HEAD') return res.end();
    createReadStream(file).pipe(res);
  });
}

/** Starts the server. Port 0 picks a free port. Resolves with { server, port }. */
export function listen(port = 4173, root = REPO_ROOT) {
  return new Promise((resolve, reject) => {
    const server = createServer(root);
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => resolve({ server, port: server.address().port }));
  });
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const flag = process.argv.indexOf('--port');
  const port = Number(flag !== -1 ? process.argv[flag + 1] : process.env.PORT) || 4173;
  listen(port).then(
    ({ port: actual }) => {
      console.log(`Serving ${REPO_ROOT}`);
      console.log(`  current site   http://localhost:${actual}/`);
      console.log(`  a candidate    http://localhost:${actual}/redesigns/<slug>/`);
    },
    err => {
      console.error(`Could not start the server: ${err.message}`);
      process.exit(1);
    },
  );
}
