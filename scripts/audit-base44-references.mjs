#!/usr/bin/env node
/**
 * Read-only Base44 migration audit.
 * Scans application source and server routes without reading .env files.
 * This reports compatibility references; it does not treat every reference
 * as proof of a live Base44 backend dependency.
 */
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const roots = ['src', 'api', 'supabase/functions'];
const extensions = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs']);
const patterns = {
  compatibilityImport: /from\s*['"][^'"]*base44Client['"]/g,
  sdkImport: /@base44\/sdk/g,
  entityCalls: /\bbase44\.entities\./g,
  authCalls: /\bbase44\.auth\./g,
  functionCalls: /\bbase44\.functions\./g,
  integrationCalls: /\bbase44\.integrations\./g,
  base44Domain: /https?:\/\/[^\s"'\x60]*base44\.com/gi,
};

async function walk(dir) {
  let entries;
  try { entries = await readdir(dir, { withFileTypes: true }); }
  catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
  const files = [];
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else if (entry.isFile() && extensions.has(path.extname(entry.name))) files.push(full);
  }
  return files;
}

const totals = Object.fromEntries(Object.keys(patterns).map(key => [key, 0]));
const findings = [];
for (const root of roots) {
  for (const file of await walk(root)) {
    const source = await readFile(file, 'utf8');
    const counts = {};
    for (const [key, pattern] of Object.entries(patterns)) {
      const matches = source.match(pattern) || [];
      counts[key] = matches.length;
      totals[key] += matches.length;
    }
    if (Object.values(counts).some(Boolean)) {
      findings.push({ file: file.split(path.sep).join('/'), ...counts });
    }
  }
}

findings.sort((a, b) =>
  (b.entityCalls + b.authCalls + b.functionCalls + b.integrationCalls + b.compatibilityImport + b.sdkImport) -
  (a.entityCalls + a.authCalls + a.functionCalls + a.integrationCalls + a.compatibilityImport + a.sdkImport)
);

console.log('Base44 migration reference audit (static; references are not all live backend dependencies)');
console.log(JSON.stringify({
  scannedRoots: roots,
  filesWithReferences: findings.length,
  totals,
  files: findings,
}, null, 2));
