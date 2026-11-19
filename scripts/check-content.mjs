// Content checks, run with `npm test`. Fails the run when content would ship
// broken or dishonest: missing media files, empty required fields, unknown
// status labels, banned stock phrases, or links that are not absolute.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pub = join(root, 'public');
const src = join(root, 'src');
const errors = [];
const fail = (m) => errors.push(m);

const walk = (d) =>
  readdirSync(d).flatMap((f) => {
    const p = join(d, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });

const content = walk(join(src, 'content')).map((f) => [f, readFileSync(f, 'utf8')]);
const all = walk(src).map((f) => [f, readFileSync(f, 'utf8')]);
const projects = content.find(([f]) => f.endsWith('projects.ts'))[1];

// 1. Every referenced media file exists.
for (const [f, s] of all) {
  const code = s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  for (const m of code.matchAll(/['"`](\/media\/[^'"`]+)['"`]/g)) {
    if (m[1].includes('${')) continue;
    if (!existsSync(join(pub, m[1]))) fail(`${f}: missing ${m[1]}`);
  }
}
// Responsive images: img('base', [w1, w2], ...) → /media/base-w.webp
for (const m of projects.matchAll(/img\(\s*'([^']+)',\s*\[([^\]]+)\]/g)) {
  for (const w of m[2].split(',').map((x) => x.trim())) {
    const p = `/media/${m[1]}-${w}.webp`;
    if (!existsSync(join(pub, p))) fail(`projects.ts: missing ${p}`);
  }
}

// 2. Status labels are from the agreed set.
const allowed = ['Live', 'In development', 'Released experiment', 'Concept', 'Client project', 'Open source', 'Hackathon entry', 'Experiment'];
for (const [f, s] of content) {
  for (const m of s.matchAll(/status:\s*'([^']+)'/g)) {
    if (!allowed.includes(m[1])) fail(`${f}: unknown status "${m[1]}"`);
  }
}

// 3. Required project fields are present for every project.
const blocks = projects.split(/\n  \{\n    slug: /).slice(1);
if (blocks.length < 1) fail('projects.ts: no projects found');
for (const b of blocks) {
  const slug = b.match(/^'([^']+)'/)?.[1] ?? '?';
  for (const k of ['name', 'category', 'role', 'status', 'summary', 'intro', 'cover', 'seo']) {
    if (!new RegExp(`\\n    ${k}:`).test(b)) fail(`project ${slug}: missing ${k}`);
  }
}

// 4. No stock phrases, no placeholder text left in content.
const banned = [
  /passionate developer/i,
  /turning dreams into reality/i,
  /building the future/i,
  /innovative solutions/i,
  /where creativity meets technology/i,
  /i love solving problems/i,
  /lorem ipsum/i,
  /\bTODO\b/,
  /\bSPS\b/,
  /lovable/i,
];
for (const [f, s] of all) {
  for (const re of banned) if (re.test(s)) fail(`${f}: contains banned text ${re}`);
}

// 5. External links are absolute https URLs.
for (const [f, s] of content) {
  for (const m of s.matchAll(/href:\s*'([^']+)'/g)) {
    if (!/^(https:\/\/|\/#[a-z-]+$)/.test(m[1])) fail(`${f}: link is not absolute https: ${m[1]}`);
  }
}

// 6. THREXA is never called a company.
if (/THREXA[^.]{0,40}\b(company|startup|firm)\b/i.test(projects)) fail('projects.ts: THREXA described as a company');

// 7. Social preview images exist for every route.
if (!existsSync(join(pub, 'og/og-default.png'))) fail('missing public/og/og-default.png');
for (const m of projects.matchAll(/\n    slug: '([^']+)'/g)) {
  if (!existsSync(join(pub, `og/og-${m[1]}.png`))) fail(`missing public/og/og-${m[1]}.png`);
}

if (errors.length) {
  console.error(`✗ ${errors.length} content problem(s):\n  ` + errors.join('\n  '));
  process.exit(1);
}
console.log('✓ content checks passed');
