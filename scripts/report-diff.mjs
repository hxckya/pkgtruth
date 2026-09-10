#!/usr/bin/env node
/**
 * Diff two SLOPSQUATS.md files and print release notes: which names entered
 * or left the published sections, and how the counts moved. Used by the
 * weekly workflow to turn each regeneration into a GitHub Release, so the
 * report has a subscribable feed instead of a silently changing file.
 *
 *   node scripts/report-diff.mjs OLD.md NEW.md > notes.md
 */
import { readFile } from 'node:fs/promises';

const [oldPath, newPath] = process.argv.slice(2);
if (!oldPath || !newPath) {
  console.error('usage: report-diff.mjs OLD.md NEW.md');
  process.exit(2);
}

/** Parse the published tables into { ecosystem: { section: Map<name, row> } }. */
function parse(md) {
  const out = {};
  let eco = null, section = null;
  for (const line of md.split('\n')) {
    const h2 = line.match(/^## (npm|PyPI)\b/);
    if (h2) { eco = h2[1]; out[eco] ??= {}; section = null; continue; }
    if (/^## /.test(line)) { eco = null; section = null; continue; }
    const h3 = line.match(/^### ([AB])\. (.+?) — \d+/);
    if (h3 && eco) { section = h3[2]; out[eco][section] ??= new Map(); continue; }
    const row = line.match(/^\| `([^`]+)` \| ([\d,?]+) \| `([^`]+)` \|/);
    if (row && eco && section) out[eco][section].set(row[1], { installs: row[2], target: row[3] });
  }
  return out;
}

const [a, b] = await Promise.all([readFile(oldPath, 'utf8'), readFile(newPath, 'utf8')]);
const before = parse(a), after = parse(b);
const today = (b.match(/_Generated (\d{4}-\d{2}-\d{2})/) || [])[1] || new Date().toISOString().slice(0, 10);

let notes = `# Live slopsquats — ${today}\n\n`;
let anyChange = false;
for (const eco of Object.keys(after)) {
  for (const section of Object.keys(after[eco])) {
    const prev = before[eco]?.[section] || new Map();
    const cur = after[eco][section];
    const added = [...cur.keys()].filter((n) => !prev.has(n));
    const removed = [...prev.keys()].filter((n) => !cur.has(n));
    notes += `## ${eco} · ${section} — ${cur.size}${prev.size !== cur.size ? ` (was ${prev.size})` : ''}\n\n`;
    if (added.length) {
      anyChange = true;
      notes += `**New this week**\n\n| name | installs / week | points to |\n|---|---|---|\n`;
      for (const n of added) notes += `| \`${n}\` | ${cur.get(n).installs} | \`${cur.get(n).target}\` |\n`;
      notes += '\n';
    }
    if (removed.length) {
      anyChange = true;
      notes += `**No longer listed** (removed from the registry, adoption changed, or the bar was not met): ${removed.map((n) => `\`${n}\``).join(', ')}\n\n`;
    }
    if (!added.length && !removed.length) notes += `No change.\n\n`;
  }
}
notes += `Full report: [SLOPSQUATS.md](https://github.com/hxckya/pkgtruth/blob/main/SLOPSQUATS.md) · Method and publication bar are described there.\n`;
process.stdout.write(notes);
process.exit(anyChange ? 0 : 3); // 3 = "nothing new" so the workflow can skip a release
