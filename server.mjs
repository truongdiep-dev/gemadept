import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const ROOT = path.dirname(fileURLToPath(import.meta.url));
import { ValidationError, validateRegistration } from './server/validation.mjs';
import { createBatchWriter } from './server/batch-writer.mjs';
import { googleTransport } from './server/google-sheets.mjs';
import { build, renderTemplate, bundleStyles } from './scripts/build.mjs';
async function readEnv() {
  try {
    const text = await readFile(path.join(ROOT, '.env'), 'utf8');
    for (const line of text.split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);
      if (match && !process.env[match[1]])
        process.env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2');
    }
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }
}
function json(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(data));
}
async function readBody(req) {
  let body = '';
  for await (const chunk of req) {
    body += chunk;
    if (Buffer.byteLength(body) > 16384) throw new ValidationError('Thông tin gửi quá lớn.');
  }
  try {
    return JSON.parse(body);
  } catch {
    throw new ValidationError('Dữ liệu gửi không hợp lệ.');
  }
}
export function createApp({ writeRegistration, publicOrigin = '', development = false } = {}) {
  return http.createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'same-origin');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; img-src 'self'; font-src 'self'; style-src 'self'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
    );
    try {
      const url = new URL(req.url, 'http://localhost');
      if (url.pathname === '/api/health' && req.method === 'GET') {
        json(res, 200, { ok: true, registrationConfigured: Boolean(writeRegistration) });
        return;
      }
      if (url.pathname === '/api/register') {
        if (req.method !== 'POST') {
          res.setHeader('Allow', 'POST');
          json(res, 405, { ok: false, message: 'Phương thức không được hỗ trợ.' });
          return;
        }
        if (!req.headers['content-type']?.startsWith('application/json')) {
          json(res, 415, { ok: false, message: 'Dữ liệu gửi không hợp lệ.' });
          return;
        }
        const origin = req.headers.origin;
        const expected = publicOrigin || `http://${req.headers.host}`;
        if (origin && origin !== expected) {
          json(res, 403, { ok: false, message: 'Nguồn gửi không hợp lệ.' });
          return;
        }
        const record = validateRegistration(await readBody(req));
        if (!writeRegistration) {
          json(res, 503, {
            ok: false,
            message: 'Đăng ký trực tuyến chưa mở. Vui lòng liên hệ Ban tổ chức hoặc thử lại sau.',
          });
          return;
        }
        try {
          json(res, 200, await writeRegistration(record));
        } catch (err) {
          console.error('Registration storage error:', err.name, err.message, err.cause?.code || '');
          json(res, 503, {
            ok: false,
            message: 'Chưa xác nhận được việc lưu đăng ký. Vui lòng thử gửi lại sau ít phút.',
          });
        }
        return;
      }
      if (!['GET', 'HEAD'].includes(req.method)) {
        res.writeHead(405);
        res.end();
        return;
      }
      let resource = decodeURIComponent(url.pathname);
      if (resource.split('/').some((segment) => segment.startsWith('.'))) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }
      if (resource === '/') resource = '/index.html';
      if (resource !== '/index.html' && !path.extname(resource) && !resource.startsWith('/api/'))
        resource = '/index.html';
      const staticAllowed =
        ['/index.html', '/styles.css'].includes(resource) ||
        /^\/src\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+\.js$/.test(resource) ||
        /^\/assets\/(images|fonts)\/[a-zA-Z0-9_.-]+\.(webp|png|otf|ttf)$/.test(resource);
      if (!staticAllowed) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }
      const file = development ? path.join(ROOT, resource) : path.join(ROOT, 'dist', resource);
      const data = development && resource === '/index.html'
        ? Buffer.from(await renderTemplate('index.html'))
        : development && resource === '/styles.css'
          ? Buffer.from(await bundleStyles())
          : await readFile(file);
      const ext = path.extname(file);
      res.writeHead(200, {
        'Content-Type': {
          '.html': 'text/html; charset=utf-8',
          '.css': 'text/css; charset=utf-8',
          '.js': 'text/javascript; charset=utf-8',
          '.webp': 'image/webp',
          '.png': 'image/png',
          '.otf': 'font/otf',
          '.ttf': 'font/ttf',
        }[ext],
        'Content-Length': data.length,
        'Cache-Control': resource.startsWith('/assets/') ? 'public, max-age=86400' : 'no-cache',
      });
      res.end(req.method === 'HEAD' ? undefined : data);
    } catch (err) {
      if (err instanceof ValidationError) json(res, 400, { ok: false, message: err.message });
      else if (err.code === 'ENOENT') {
        res.writeHead(404);
        res.end('Not found');
      } else {
        console.error('Request failed:', err.name);
        json(res, 500, { ok: false, message: 'Có lỗi xảy ra. Vui lòng thử lại.' });
      }
    }
  });
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const development = process.argv.includes('--dev');
  if (!development) await build();
  await readEnv();
  const configured =
    /^https:\/\/script\.google\.com\/macros\/s\/[a-zA-Z0-9_-]+\/exec$/.test(
      process.env.GOOGLE_SCRIPT_URL || '',
    ) && (process.env.GOOGLE_SCRIPT_SECRET || '').length >= 32;
  const server = createApp({
    writeRegistration: configured ? createBatchWriter(googleTransport) : undefined,
    publicOrigin: process.env.PUBLIC_ORIGIN || '',
    development,
  });
  const port = Number(process.env.PORT || 3000),
    host = process.env.HOST || '127.0.0.1';
  server.listen(port, host, () =>
    console.log(
      `Gemadept preview: http://${host}:${port}\nGoogle Sheets: ${configured ? 'configured' : 'not connected yet'}`,
    ),
  );
}
