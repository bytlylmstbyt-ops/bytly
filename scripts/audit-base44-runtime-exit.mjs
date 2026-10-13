#!/usr/bin/env node
/**
 * Strict release gate for removing Base44 runtime compatibility.
 * Reports every runtime call site grouped by file so the remaining work can be
 * migrated deliberately without deleting a compatibility layer prematurely.
 */
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const roots = ['src', 'api', 'supabase/functions'];
const extensions = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs']);
const adapterPath = 'src/api/base44Client.js';
const patterns = [
  ['compatibility adapter import', /(?:from\s*|import\s*)['"][^'"]*base44Client(?:\.js)?['"]/g],
  ['legacy entity API', /\bbase44\.entities\./g],
  ['legacy auth API', /\bbase44\.auth\./g],
  ['legacy function API', /\bbase44\.functions\./g],
  ['legacy integration API', /\bbase44\.integrations\./g],
  ['unsupported function fallback', /وظيفة غير مرحّلة إلى Supabase/g],
];

async function walk(dir) {
  let entries;
  try { entries = await readdir(dir, { withFileTypes: true }); }
  catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
  const files = [];
  for (const entry of entries) {
    if (['node_modules', 'dist', 'coverage'].includes(entry.name) || entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else if (entry.isFile() && extensions.has(path.extname(entry.name))) files.push(full);
  }
  return files;
}

const findings = [];
for (const root of roots) {
  for (const file of await walk(root)) {
    const normalized = file.split(path.sep).join('/');
    if (normalized === adapterPath) continue;
    const source = await readFile(file, 'utf8');
    const lines = source.split(/\r?\n/);
    for (const [label, pattern] of patterns) {
      for (let i = 0; i < lines.length; i++) {
        pattern.lastIndex = 0;
        const matches = lines[i].match(pattern);
        if (matches) findings.push({ file: normalized, line: i + 1, category: label, count: matches.length });
      }
    }
  }
}

const byFile = new Map();
for (const finding of findings) {
  if (!byFile.has(finding.file)) byFile.set(finding.file, { file: finding.file, total: 0, categories: {} });
  const item = byFile.get(finding.file);
  item.total += finding.count;
  if (!item.categories[finding.category]) item.categories[finding.category] = [];
  item.categories[finding.category].push({ line: finding.line, count: finding.count });
}
const report = {
  scannedRoots: roots,
  findings: findings.reduce((n, finding) => n + finding.count, 0),
  filesWithFindings: byFile.size,
  byCategory: Object.fromEntries(patterns.map(([label]) => [label, findings.filter(f => f.category === label).reduce((n, f) => n + f.count, 0)])),
  byFile: [...byFile.values()].sort((a, b) => a.file.localeCompare(b.file)),
};

console.log('Strict Base44 runtime exit gate');
console.log(JSON.stringify(report, null, 2));

if (report.findings) {
  console.error('FAIL: active application code still depends on the Base44 compatibility surface. Migrate every listed call site before claiming Base44 independence.');
  process.exitCode = 1;
} else {
  console.log('PASS: no Base44 compatibility call sites found in scanned runtime roots.');
}
