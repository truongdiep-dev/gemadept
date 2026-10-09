import {mkdir, copyFile, cp} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'dist');
await mkdir(output, {recursive:true});
for (const file of ['index.html', 'styles.css', 'app.js']) {
  await copyFile(path.join(root, file), path.join(output, file));
}
for (const folder of ['images', 'fonts']) {
  await cp(path.join(root, 'assets', folder), path.join(output, 'assets', folder), {recursive:true});
}