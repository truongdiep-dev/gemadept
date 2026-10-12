import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const titles = [
  { page: '03', name: 'title-thu-ngo-sharp', x: 2347, y: 920, w: 1320, h: 747, width: 900 },
  { page: '03', name: 'title-welcome-sharp', x: 1940, y: 5800, w: 2293, h: 667, width: 1200 },
  { page: '04', name: 'title-agenda-sharp', x: 2367, y: 1133, w: 1267, h: 613, width: 800 },
  { page: '04', name: 'title-program-sharp', x: 2167, y: 4360, w: 1653, h: 567, width: 1000 },
  { page: '06', name: 'title-activities-sharp', x: 2333, y: 300, w: 1347, h: 580, width: 850 },
];

function ffmpeg(args, options = {}) {
  const result = spawnSync('ffmpeg', ['-loglevel', 'error', ...args], { maxBuffer: 64 * 1024 * 1024, ...options });
  if (result.status !== 0) throw new Error(result.stderr?.toString() || `ffmpeg exited ${result.status}`);
  return result.stdout;
}

function median(values) {
  values.sort((a, b) => a - b);
  return values[Math.floor(values.length / 2)];
}

for (const t of titles) {
  const source = join(root, 'source', 'JPG', `GMD-thumoionl-${t.page}.jpg`);
  const rgb = ffmpeg(['-i', source, '-vf', `crop=${t.w}:${t.h}:${t.x}:${t.y}`, '-pix_fmt', 'rgb24', '-f', 'rawvideo', 'pipe:1']);
  const rgba = Buffer.alloc(t.w * t.h * 4);
  for (let y = 0; y < t.h; y++) {
    const samples = [[], [], []];
    for (let x = 0; x < 20; x++) {
      for (const edge of [x, t.w - 1 - x]) {
        const i = (y * t.w + edge) * 3;
        for (let c = 0; c < 3; c++) samples[c].push(rgb[i + c]);
      }
    }
    const bg = samples.map(median);
    for (let x = 0; x < t.w; x++) {
      const i = (y * t.w + x) * 3;
      const o = (y * t.w + x) * 4;
      // The source background changes brightness across the page, but stays blue.
      // Red in excess of blue identifies the gold strokes without exposing the gradient.
      const goldSignal = rgb[i] - rgb[i + 2] * 0.25;
      const alpha = Math.max(0, Math.min(1, (goldSignal + 5) / 55));
      for (let c = 0; c < 3; c++) rgba[o + c] = alpha ? Math.max(0, Math.min(255, Math.round((rgb[i + c] - bg[c] * (1 - alpha)) / alpha))) : 0;
      rgba[o + 3] = Math.round(alpha * 255);
    }
  }
  const output = join(root, 'assets', 'images', `${t.name}.webp`);
  ffmpeg(['-y', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${t.w}x${t.h}`, '-i', 'pipe:0', '-vf', `scale=${t.width}:-1:flags=lanczos`, '-lossless', '1', '-compression_level', '6', output], { input: rgba });
  console.log(`${t.name}: ${t.width}px`);
}
