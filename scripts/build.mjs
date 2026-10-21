import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'src');
const output = path.join(root, 'dist');

function inside(directory, relative) {
  const file = path.resolve(directory, relative);
  if (!file.startsWith(directory + path.sep)) throw new Error(`Invalid source path: ${relative}`);
  return file;
}

const escapeAttribute = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (char) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[char],
  );

export async function renderTemplate(relative, props = {}, ancestors = []) {
  if (ancestors.includes(relative)) throw new Error(`Circular template: ${relative}`);
  let text = await readFile(inside(source, relative), 'utf8');
  const includes = [
    ...text.matchAll(/<!--\s*include:\s*([\w/.-]+\.html)(?:\s+(\{[^{}]*?\}))?\s*-->/g),
  ];
  for (const match of includes) {
    const content = await renderTemplate(match[1], match[2] ? JSON.parse(match[2]) : {}, [
      ...ancestors,
      relative,
    ]);
    text = text.replace(match[0], content.trim());
  }
  text = text.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    if (!(key in props)) throw new Error(`Missing template property ${key} in ${relative}`);
    return escapeAttribute(props[key]);
  });
  if (text.includes('{{') || /<!--\s*include:/.test(text))
    throw new Error(`Unresolved template in ${relative}`);
  return text;
}

export async function bundleStyles() {
  const entry = await readFile(path.join(source, 'styles/index.css'), 'utf8');
  const chunks = [];
  for (const match of entry.matchAll(/@import ['"]([^'"]+)['"];?/g)) {
    const relative = path.relative(source, path.resolve(source, 'styles', match[1]));
    chunks.push(await readFile(inside(source, relative), 'utf8'));
  }
  return chunks.join('\n');
}

async function copyModules(relative = '') {
  for (const entry of await readdir(path.join(source, relative), { withFileTypes: true })) {
    const name = path.join(relative, entry.name);
    if (entry.isDirectory()) await copyModules(name);
    else if (entry.name.endsWith('.js')) {
      const destination = inside(path.join(output, 'src'), name);
      await mkdir(path.dirname(destination), { recursive: true });
      await cp(path.join(source, name), destination);
    }
  }
}

export async function build() {
  const [html, css] = await Promise.all([renderTemplate('index.html'), bundleStyles()]);
  // Only the generated dist directory inside this repository is replaced.
  if (output !== path.join(root, 'dist') || !output.startsWith(root + path.sep)) {
    throw new Error('Build output is outside the project');
  }
  await rm(output, { recursive: true, force: true });
  await mkdir(output, { recursive: true });
  await writeFile(path.join(output, 'index.html'), html);
  await writeFile(path.join(output, 'styles.css'), css);
  await copyModules();
  await cp(path.join(root, 'assets'), path.join(output, 'assets'), { recursive: true });
  await cp(path.join(root, 'favicon.ico'), path.join(output, 'favicon.ico'));
  console.log('Built pages, components, modules and assets into dist/.');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await build();
}
